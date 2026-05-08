from app.models.database import db

class Parametre(db.Model):
    __tablename__ = 'parametres'

    id  = db.Column(db.Integer, primary_key=True)
    cle = db.Column(db.String(50), unique=True, nullable=False)
    valeur = db.Column(db.String(200), nullable=False)

    DEFAULTS = {
        'tarif_par_kg': '500',
        'devise':       'FCFA',
    }

    @classmethod
    def get(cls, cle):
        row = cls.query.filter_by(cle=cle).first()
        return row.valeur if row else cls.DEFAULTS.get(cle)

    @classmethod
    def set(cls, cle, valeur):
        row = cls.query.filter_by(cle=cle).first()
        if row:
            row.valeur = str(valeur)
        else:
            db.session.add(cls(cle=cle, valeur=str(valeur)))

    @classmethod
    def seed_defaults(cls):
        for cle, valeur in cls.DEFAULTS.items():
            if not cls.query.filter_by(cle=cle).first():
                db.session.add(cls(cle=cle, valeur=valeur))
        db.session.commit()

    def to_dict(self):
        return {'cle': self.cle, 'valeur': self.valeur}
