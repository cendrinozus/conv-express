from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required
from app.utils import current_user
from app.models.database import db
from app.models.facture import Facture
from app.models.colis import Colis
from datetime import datetime
import io

factures_bp = Blueprint('factures', __name__)

@factures_bp.route('/', methods=['GET'])
@jwt_required()
def list_factures():
    current = current_user()
    
    if current['role'] == 'convoyeur':
        factures = db.session.query(Facture).join(Colis).filter(
            Colis.convoyeur_id == current['id']
        ).order_by(Facture.created_at.desc()).all()
    else:
        factures = Facture.query.order_by(Facture.created_at.desc()).all()
    
    result = []
    for f in factures:
        d = f.to_dict()
        d['colis'] = f.colis.to_dict() if f.colis else None
        result.append(d)
    return jsonify(result), 200

@factures_bp.route('/<int:facture_id>', methods=['GET'])
@jwt_required()
def get_facture(facture_id):
    facture = Facture.query.get_or_404(facture_id)
    d = facture.to_dict()
    d['colis'] = facture.colis.to_dict() if facture.colis else None
    return jsonify(d), 200

@factures_bp.route('/numero/<string:numero>', methods=['GET'])
def get_by_numero(numero):
    facture = Facture.query.filter_by(numero_facture=numero).first()
    if not facture:
        return jsonify({'message': 'Facture non trouvée'}), 404
    d = facture.to_dict()
    d['colis'] = facture.colis.to_dict() if facture.colis else None
    return jsonify(d), 200

@factures_bp.route('/<int:facture_id>/pdf', methods=['GET'])
@jwt_required()
def generate_pdf(facture_id):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    except ImportError:
        return jsonify({'message': 'ReportLab non installé. Installez avec: pip install reportlab'}), 500

    facture = Facture.query.get_or_404(facture_id)
    colis = facture.colis

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    BLUE = colors.HexColor('#1a3c6e')
    ORANGE = colors.HexColor('#e87c1e')
    LIGHT = colors.HexColor('#f5f7fa')
    
    title_style = ParagraphStyle('Title', parent=styles['Title'],
                                  fontSize=22, textColor=BLUE, spaceAfter=4, alignment=TA_CENTER)
    sub_style = ParagraphStyle('Sub', parent=styles['Normal'],
                                fontSize=10, textColor=colors.grey, alignment=TA_CENTER)
    section_style = ParagraphStyle('Section', parent=styles['Normal'],
                                    fontSize=11, textColor=BLUE,
                                    fontName='Helvetica-Bold', spaceBefore=12, spaceAfter=4)
    normal = ParagraphStyle('N', parent=styles['Normal'], fontSize=10)
    
    elems = []
    
    # En-tête
    elems.append(Paragraph("CONVOYAGE EXPRESS", title_style))
    elems.append(Paragraph("Service de transport et livraison de colis", sub_style))
    elems.append(Spacer(1, 0.3*cm))
    elems.append(HRFlowable(width="100%", thickness=2, color=ORANGE))
    elems.append(Spacer(1, 0.5*cm))

    # Numéro facture
    info_data = [
        ['FACTURE', facture.numero_facture],
        ['Date', facture.created_at.strftime('%d/%m/%Y %H:%M')],
        ['Tracking', colis.numero_tracking],
        ['Statut paiement', '✓ PAYÉ' if facture.statut_paiement == 'paye' else '⚠ NON PAYÉ'],
        ['Mode paiement', 'Au départ' if facture.mode_paiement == 'depart' else 'À destination'],
    ]
    t = Table(info_data, colWidths=[5*cm, 9*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), BLUE),
        ('TEXTCOLOR', (0,0), (0,-1), colors.white),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('FONTNAME', (0,0), (0,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (0,0), 12),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (1,1), (-1,-1), [colors.white, LIGHT]),
        ('TEXTCOLOR', (1,3), (1,3), colors.green if facture.statut_paiement == 'paye' else colors.red),
        ('FONTNAME', (1,3), (1,3), 'Helvetica-Bold'),
        ('BOX', (0,0), (-1,-1), 1, colors.lightgrey),
        ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
    ]))
    elems.append(t)
    elems.append(Spacer(1, 0.5*cm))
    
    # Expéditeur / Destinataire
    elems.append(Paragraph("INFORMATIONS D'ENVOI", section_style))
    parties_data = [
        ['EXPÉDITEUR', 'DESTINATAIRE'],
        [colis.expediteur_nom, colis.destinataire_nom],
        [colis.expediteur_telephone, colis.destinataire_telephone],
        [colis.expediteur_adresse or '-', colis.destinataire_adresse or '-'],
    ]
    tp = Table(parties_data, colWidths=[8.5*cm, 8.5*cm])
    tp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT]),
        ('BOX', (0,0), (-1,-1), 1, colors.lightgrey),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
    ]))
    elems.append(tp)
    elems.append(Spacer(1, 0.5*cm))
    
    # Trajet
    elems.append(Paragraph("TRAJET", section_style))
    trajet_data = [['Origine', 'Destination', 'Description'],
                   [colis.origine, colis.destination, colis.description or '-']]
    tt = Table(trajet_data, colWidths=[5*cm, 5*cm, 7*cm])
    tt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,1), (-1,-1), LIGHT),
        ('BOX', (0,0), (-1,-1), 1, colors.lightgrey),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
    ]))
    elems.append(tt)
    elems.append(Spacer(1, 0.5*cm))
    
    # Détail facturation
    elems.append(Paragraph("DÉTAIL DE FACTURATION", section_style))
    fact_data = [
        ['Description', 'Poids (kg)', 'Tarif/kg', 'Montant'],
        ['Transport de colis', f"{facture.poids:.2f} kg",
         f"{facture.tarif_kg:,.0f} {facture.devise}",
         f"{facture.montant_total:,.0f} {facture.devise}"],
        ['', '', 'TOTAL DÛ', f"{facture.montant_total:,.0f} {facture.devise}"],
    ]
    tf = Table(fact_data, colWidths=[6*cm, 3*cm, 4*cm, 4*cm])
    tf.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,1), (-1,1), LIGHT),
        ('BACKGROUND', (2,2), (-1,2), ORANGE),
        ('TEXTCOLOR', (2,2), (-1,2), colors.white),
        ('FONTNAME', (2,2), (-1,2), 'Helvetica-Bold'),
        ('FONTSIZE', (2,2), (-1,2), 11),
        ('BOX', (0,0), (-1,-1), 1, colors.lightgrey),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
    ]))
    elems.append(tf)
    
    if facture.statut_paiement == 'paye' and facture.paye_par:
        elems.append(Spacer(1, 0.3*cm))
        elems.append(Paragraph(
            f"<b>Payé par:</b> {facture.paye_par} le {facture.date_paiement.strftime('%d/%m/%Y %H:%M') if facture.date_paiement else '-'}",
            normal))
    
    # Footer
    elems.append(Spacer(1, 1*cm))
    elems.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elems.append(Spacer(1, 0.2*cm))
    elems.append(Paragraph(
        "Merci de votre confiance — Convoyage Express | contact@convoyage.com",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8,
                        textColor=colors.grey, alignment=TA_CENTER)
    ))
    
    doc.build(elems)
    buf.seek(0)
    return send_file(buf, mimetype='application/pdf',
                     download_name=f"facture_{facture.numero_facture}.pdf",
                     as_attachment=False)
