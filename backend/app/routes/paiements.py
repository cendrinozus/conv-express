from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from app.utils import current_user
from app.models.database import db
from app.models.facture import Facture
from app.models.colis import Colis
from datetime import datetime
import io

paiements_bp = Blueprint('paiements', __name__)

@paiements_bp.route('/payer/<int:facture_id>', methods=['POST'])
@jwt_required()
def payer(facture_id):
    current = current_user()
    if current['role'] not in ['admin', 'convoyeur']:
        return jsonify({'message': 'Accès refusé'}), 403

    facture = Facture.query.get_or_404(facture_id)
    if facture.statut_paiement == 'paye':
        return jsonify({'message': 'Cette facture est déjà payée'}), 400

    data = request.get_json()
    facture.statut_paiement = 'paye'
    facture.date_paiement = datetime.utcnow()
    facture.paye_par = data.get('paye_par', 'Inconnu')
    facture.notes = data.get('notes', '')

    # Si payé à destination et colis arrivé → livrer
    colis = facture.colis
    if colis and colis.statut == 'arrive':
        colis.statut = 'livre'

    db.session.commit()
    d = facture.to_dict()
    d['colis'] = colis.to_dict() if colis else None
    return jsonify({'message': 'Paiement enregistré avec succès', 'facture': d}), 200

@paiements_bp.route('/verifier/<string:numero_facture>', methods=['GET'])
def verifier_facture(numero_facture):
    facture = Facture.query.filter_by(numero_facture=numero_facture).first()
    if not facture:
        return jsonify({'message': 'Facture non trouvée', 'valide': False}), 404

    colis = facture.colis
    return jsonify({
        'valide': True,
        'facture': facture.to_dict(),
        'colis': colis.to_dict() if colis else None,
        'peut_retirer': facture.statut_paiement == 'paye' and colis.statut in ['arrive', 'livre']
    }), 200

@paiements_bp.route('/stats', methods=['GET'])
@jwt_required()
def stats_paiements():
    current = current_user()

    if current['role'] == 'convoyeur':
        query = db.session.query(Facture).join(Colis).filter(Colis.convoyeur_id == current['id'])
    else:
        query = Facture.query

    total = query.count()
    payes = query.filter(Facture.statut_paiement == 'paye').count()
    non_payes = query.filter(Facture.statut_paiement == 'non_paye').count()

    montant_total = db.session.query(db.func.sum(Facture.montant_total)).scalar() or 0
    montant_percu = db.session.query(db.func.sum(Facture.montant_total)).filter(
        Facture.statut_paiement == 'paye').scalar() or 0

    return jsonify({
        'total_factures': total,
        'factures_payees': payes,
        'factures_non_payees': non_payes,
        'montant_total': montant_total,
        'montant_percu': montant_percu,
        'montant_en_attente': montant_total - montant_percu
    }), 200


@paiements_bp.route('/recu/<int:facture_id>', methods=['GET'])
@jwt_required()
def generate_recu(facture_id):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    except ImportError:
        return jsonify({'message': 'ReportLab non installé'}), 500

    facture = Facture.query.get_or_404(facture_id)
    if facture.statut_paiement != 'paye':
        return jsonify({'message': "Cette facture n'est pas encore payée"}), 400

    colis = facture.colis

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    BLUE     = colors.HexColor('#1a3c6e')
    ORANGE   = colors.HexColor('#e87c1e')
    GREEN    = colors.HexColor('#16a34a')
    LIGHT    = colors.HexColor('#f5f7fa')
    GREEN_BG = colors.HexColor('#dcfce7')

    title_style = ParagraphStyle('Title', parent=styles['Title'],
                                  fontSize=22, textColor=BLUE, spaceAfter=4, alignment=TA_CENTER)
    sub_style   = ParagraphStyle('Sub', parent=styles['Normal'],
                                  fontSize=10, textColor=colors.grey, alignment=TA_CENTER)
    section_style = ParagraphStyle('Section', parent=styles['Normal'],
                                    fontSize=11, textColor=BLUE,
                                    fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=4)
    small = ParagraphStyle('S', parent=styles['Normal'], fontSize=8,
                            textColor=colors.grey, alignment=TA_CENTER)

    elems = []

    # En-tête
    elems.append(Paragraph("CONVOYAGE EXPRESS", title_style))
    elems.append(Paragraph("Service de transport et livraison de colis", sub_style))
    elems.append(Spacer(1, 0.3*cm))
    elems.append(HRFlowable(width="100%", thickness=2, color=ORANGE))
    elems.append(Spacer(1, 0.4*cm))
    elems.append(Paragraph("REÇU DE PAIEMENT", ParagraphStyle(
        'RecuTitle', parent=styles['Normal'], fontSize=16, fontName='Helvetica-Bold',
        textColor=GREEN, alignment=TA_CENTER, spaceAfter=4)))
    elems.append(Spacer(1, 0.4*cm))

    # Cachet de confirmation
    tc = Table([['✓  PAIEMENT REÇU']], colWidths=[17*cm])
    tc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), GREEN_BG),
        ('TEXTCOLOR', (0,0), (-1,-1), GREEN),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 13),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 1.5, GREEN),
    ]))
    elems.append(tc)
    elems.append(Spacer(1, 0.5*cm))

    # Infos du reçu
    elems.append(Paragraph("INFORMATIONS DU REÇU", section_style))
    info_rows = [
        ['N° Reçu',        f"REC-{facture.numero_facture}"],
        ['N° Facture',     facture.numero_facture],
        ['N° Tracking',    colis.numero_tracking],
        ['Date paiement',  facture.date_paiement.strftime('%d/%m/%Y à %H:%M') if facture.date_paiement else '-'],
        ['Encaissé par',   facture.paye_par or '-'],
        ['Mode paiement',  'Au départ' if facture.mode_paiement == 'depart' else 'À destination'],
    ]
    if facture.notes:
        info_rows.append(['Notes', facture.notes])

    ti = Table(info_rows, colWidths=[5*cm, 12*cm])
    ti.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), BLUE),
        ('TEXTCOLOR', (0,0), (0,-1), colors.white),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (1,0), (-1,-1), [colors.white, LIGHT]),
        ('BOX', (0,0), (-1,-1), 1, colors.lightgrey),
        ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
    ]))
    elems.append(ti)
    elems.append(Spacer(1, 0.5*cm))

    # Expéditeur / Destinataire
    elems.append(Paragraph("PARTIES CONCERNÉES", section_style))
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
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT]),
        ('BOX', (0,0), (-1,-1), 1, colors.lightgrey),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
    ]))
    elems.append(tp)
    elems.append(Spacer(1, 0.5*cm))

    # Montant payé
    elems.append(Paragraph("MONTANT ENCAISSÉ", section_style))
    montant_data = [
        ['Description', 'Poids', 'Tarif/kg', 'Montant'],
        ['Transport de colis',
         f"{facture.poids:.2f} kg",
         f"{facture.tarif_kg:,.0f} {facture.devise}",
         f"{facture.montant_total:,.0f} {facture.devise}"],
        ['', '', 'TOTAL ENCAISSÉ', f"{facture.montant_total:,.0f} {facture.devise}"],
    ]
    tf = Table(montant_data, colWidths=[6*cm, 3*cm, 4*cm, 4*cm])
    tf.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,1), (-1,1), LIGHT),
        ('BACKGROUND', (2,2), (-1,2), GREEN),
        ('TEXTCOLOR', (2,2), (-1,2), colors.white),
        ('FONTNAME', (2,2), (-1,2), 'Helvetica-Bold'),
        ('FONTSIZE', (2,2), (-1,2), 11),
        ('BOX', (0,0), (-1,-1), 1, colors.lightgrey),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
    ]))
    elems.append(tf)

    # Mention légale
    elems.append(Spacer(1, 0.6*cm))
    date_str = facture.date_paiement.strftime('%d/%m/%Y') if facture.date_paiement else '-'
    elems.append(Paragraph(
        f"Ce reçu confirme que le paiement de la facture <b>{facture.numero_facture}</b> "
        f"d'un montant de <b>{facture.montant_total:,.0f} {facture.devise}</b> "
        f"a bien été encaissé le <b>{date_str}</b>.",
        ParagraphStyle('Legal', parent=styles['Normal'], fontSize=9,
                        textColor=colors.grey, alignment=TA_CENTER)))

    # Footer
    elems.append(Spacer(1, 0.8*cm))
    elems.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elems.append(Spacer(1, 0.2*cm))
    elems.append(Paragraph(
        "Merci de votre confiance — Convoyage Express | contact@convoyage.com",
        small))

    doc.build(elems)
    buf.seek(0)
    return send_file(buf, mimetype='application/pdf',
                     download_name=f"recu_{facture.numero_facture}.pdf",
                     as_attachment=False)
