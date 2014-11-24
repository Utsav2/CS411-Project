import os
import json
from flask import Flask, render_template, jsonify, request
import psycopg2
import datetime
import requests

# initialization
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://ivxreaxdzurffp:b8iMA7KJCGaFMKIjZYhtzqywfm@ec2-184-73-194-196.compute-1.amazonaws.com:5432/d8rilo7dk8mh5i'

conn = psycopg2.connect(dbname="d8rilo7dk8mh5i", user= "ivxreaxdzurffp", password="b8iMA7KJCGaFMKIjZYhtzqywfm", host="ec2-184-73-194-196.compute-1.amazonaws.com")

cursor = conn.cursor()

# controllers
@app.route("/")
def hello():
    return render_template('HTMLPage.html')

@app.route("/searchRestaurant", methods=['GET'])
def restaurantSearch():
  flag = 1
  searchTerm = request.args.get('name')
  if searchTerm is None:
    searchTerm = request.args.get('hours')
    flag = 2
    if searchTerm is None:
      searchTerm = request.args.get('cuisine') 
      flag = 3

  if flag is 1:
    SQL = "SELECT * FROM restaurantNames WHERE name LIKE '%%"+ searchTerm +"%%';"
  if flag is 2:
    #TODO: LONG ASS SQL COMMAND
    SQL = "SELECT * FROM restaurantHours WHERE mopen > searchTerm > mclose or topen > searchTerm > tclose or wopen > searchTerm > wclose or hopen > searchTerm > hclose or fopen > searchTerm > fclose or sopen > searchTerm > sclose or upoen > searchTerm > uclose;"
  if flag is 3:
    SQL = "SELECT * FROM restaurantCuisine WHERE cuisine LIKE '%%" + cuisine + "%%';" 

  cursor.execute(SQL)
  rows = [x for x in cursor]
  cols = [x[0] for x in curosr.description]
  courses = []   
  for row in rows:
    course = {}
    for prop, val in zip(cols, row):
      course[prop] = val
      courses.append(course)

  return json.dumps(courses)

@app.route("/searchBuildings", methods=['GET'])
def adminBuildSearch():
  
    searchBuild = request.args['building'];
    SQL = "SELECT * FROM buildings WHERE building LIKE '%%" + searchBuild + "%%' or buildingname LIKE '%%" + searchBuild + "%%' or latitude LIKE '%%" + searchBuild + "%%' or longitude LIKE '%%" + searchBuild + "%%';"
    
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

@app.route("/admin1", methods=['POST'])
def adminAccess():
    
    buildinput = request.form['buildinput']
    nameinput = request.form['nameinput']
    latinput = request.form['latinput']
    longinput = request.form['longinput']
    flag = request.form['flag']

    SQL = ''

    if(flag == '0'):
      cursor.execute("INSERT INTO buildings (building, buildingname, latitude, longitude) VALUES ('" + buildinput + "','" + nameinput + "','" + latinput + "','" + longinput + "');")

    elif(flag == '1'):
      cursor.execute("DELETE FROM buildings WHERE building = '" + buildinput + "';")

    else:
      cursor.execute("UPDATE buildings SET building = '" + buildinput + "', buildingname = '" + nameinput + "', latitude = '" + latinput + "', longitude = '" + longinput + "' WHERE building = '" + buildinput + "';")
    
    #cursor.execute(SQL)
    conn.commit()

    return jsonify("")
      
@app.route("/admin")
def admin():
   return render_template('admin.html')

@app.route("/getCourses")
def getCourseList():
  term = request.args['term'].upper()
  SQL = "SELECT DISTINCT crn, title, subjnbr FROM sections WHERE subjnbr LIKE '%%" + term + "%%' or title LIKE '%%" + term + "%%' or crn LIKE '%%" + term + "%%' ;"
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

@app.route("/getCoursesWithDays")
def getCourseListWithDays():  
  
  term = request.args['term'];

  SQL = "SELECT DISTINCT m, t, w, h, f, begintime, endtime, crn, subjnbr, title, latitude, longitude FROM sections, buildings WHERE crn = '" + term + "' AND sections.building = buildings.building;"

  cursor.execute(SQL)
  rows = [x for x in cursor]
  cols = [x[0] for x in cursor.description]
  courses = []
  for row in rows:
    course = {}
    for prop, val in zip(cols, row):
      if type(val) is datetime.datetime or type(val) is datetime.time:
        course[prop] = val.isoformat()
        continue
      else:
        course[prop] = val
        courses.append(course)

  return json.dumps(courses)

@app.route("/directions")
def directions():
    url = "http://maps.googleapis.com/maps/api/directions/json?origin=Toronto&destination=Montreal"
    r = requests.get(url)
    return  jsonify(r.json())
# launch
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
