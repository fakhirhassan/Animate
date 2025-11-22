"""
Database Models (Future Implementation)
SQLAlchemy models for AniMate.
"""

# from flask_sqlalchemy import SQLAlchemy
# from datetime import datetime

# db = SQLAlchemy()

# Placeholder models - uncomment and implement when needed

"""
class User(db.Model):
    '''User model for authentication.'''
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='creator')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    projects = db.relationship('Project', backref='user', lazy=True)

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)


class Project(db.Model):
    '''Project model for storing animation projects.'''
    __tablename__ = 'projects'

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='draft')
    input_file = db.Column(db.String(500))
    output_file = db.Column(db.String(500))
    settings = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ConversionJob(db.Model):
    '''Conversion job tracking.'''
    __tablename__ = 'conversion_jobs'

    id = db.Column(db.String(36), primary_key=True)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'))
    status = db.Column(db.String(20), default='queued')
    progress = db.Column(db.Integer, default=0)
    input_path = db.Column(db.String(500))
    output_path = db.Column(db.String(500))
    error_message = db.Column(db.Text)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
"""
