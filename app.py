import os
import json
from flask import Flask, render_template, url_for, jsonify, request
import psycopg2

# initialization
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://ivxreaxdzurffp:b8iMA7KJCGaFMKIjZYhtzqywfm@ec2-184-73-194-196.compute-1.amazonaws.com:5432/d8rilo7dk8mh5i'
app.config.update(
    DEBUG = True,
)

conn = psycopg2.connect(dbname="d8rilo7dk8mh5i", user= "ivxreaxdzurffp", password="b8iMA7KJCGaFMKIjZYhtzqywfm", host="ec2-184-73-194-196.compute-1.amazonaws.com")

cursor = conn.cursor()


# controllersasdf
@app.route("/")
def hello():
    return render_template('HTMLPage.html')

@app.route("/admin1", methods=['POST'])
def adminAccess():

    
    buildinput = request.form['buildinput'];
    nameinput = request.form['nameinput'];
    latinput = request.form['latinput'];
    longinput = request.form['longinput'];
    flag = request.form['flag']

    SQL = ''

    if(flag == '0'):
      cursor.execute("INSERT INTO buildings (building, buildingname, latitude, longitude) VALUES ('" + buildinput + "','" + nameinput + "','" + latinput + "','" + longinput + "');")

    elif(flag == '1'):
      cursor.execute("DELETE FROM buildings WHERE building = '" + buildinput + "';")

    else:
      cursor.execute("UPDATE buildings SET building = '" + buildinput + "', buildingname = '" + nameinput + "', latitude = '" + latinput + "', longitude = '" + longinput + "' WHERE building = '" + buildinput + "';")
    
    print SQL

    #cursor.execute(SQL)
    conn.commit()

    return jsonify("")
      
@app.route("/admin")
def admin():
   return render_template('admin.html')

@app.route("/getCourses")
def getCourseList():  
  
  term = request.args['term'];

  SQL = "SELECT crn, title, subjnbr FROM sections WHERE subjnbr LIKE '%%" + term + "%%' or title LIKE '%%" + term + "%%';"
  data = (term, )

  cursor.execute(SQL)
  rows = [x for x in cursor]
  cols = [x[0] for x in cursor.description]
  courses = []
  for row in rows:
    course = {}
    for prop, val in zip(cols, row):
      course[prop] = val
      courses.append(course)

  return json.dumps(courses)


# launch
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)