import os
from flask import Flask, render_template, url_for

# initialization
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://ivxreaxdzurffp:b8iMA7KJCGaFMKIjZYhtzqywfm@ec2-184-73-194-196.compute-1.amazonaws.com:5432/d8rilo7dk8mh5i'
app.config.update(
    DEBUG = True,
)

# controllers
@app.route("/")
def hello():
    return render_template('HTMLPage.html')

@app.route("/admin")
def adminAccess():
    return render_template('HTMLPage.html')


# launch
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
