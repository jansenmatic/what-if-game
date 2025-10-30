from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)

# Use PostgreSQL URL from environment variable in production, SQLite in development
if 'POSTGRES_URL' in os.environ:
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['POSTGRES_URL']
else: 
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///leaderboard.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')  # Change this in production
db = SQLAlchemy(app)

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

# Admin authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_logged_in' not in session:
            flash('Please log in first!')
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

with app.app_context():
    db.create_all()
    # Create default admin if not exists
    if not Admin.query.filter_by(username='admin').first():
        admin = Admin(
            username='admin',
            password=generate_password_hash('admin123')  # Change this password!
        )
        db.session.add(admin)
        db.session.commit()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save_score', methods=['POST'])
def save_score():
    data = request.json
    new_score = Score(name=data['name'], score=data['score'])
    db.session.add(new_score)
    db.session.commit()
    return jsonify({'message': 'Score saved successfully'})

@app.route('/gameover')
def gameover():
    # Get top 10 scores
    top_scores = Score.query.order_by(Score.score.desc()).limit(10).all()
    return render_template('gameover.html', scores=top_scores)

# Admin routes
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        admin = Admin.query.filter_by(username=username).first()
        if admin and check_password_hash(admin.password, password):
            session['admin_logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        flash('Invalid credentials!')
    return render_template('admin/login.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin_login'))

@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    scores = Score.query.order_by(Score.date.desc()).all()
    return render_template('admin/dashboard.html', scores=scores)

@app.route('/admin/scores/delete/<int:id>')
@admin_required
def delete_score(id):
    score = Score.query.get_or_404(id)
    db.session.delete(score)
    db.session.commit()
    flash('Score deleted successfully!')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/scores/edit/<int:id>', methods=['GET', 'POST'])
@admin_required
def edit_score(id):
    score = Score.query.get_or_404(id)
    if request.method == 'POST':
        score.name = request.form.get('name')
        score.score = request.form.get('score')
        db.session.commit()
        flash('Score updated successfully!')
        return redirect(url_for('admin_dashboard'))
    return render_template('admin/edit_score.html', score=score)

if __name__ == '__main__':
    app.run(debug=True)
