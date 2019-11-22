import sys
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pprint
import json

from flask import Flask, render_template, request

app = Flask(__name__)


@app.route("/")
def main():
    return render_template('index.html')


@app.route('/updateSheet', methods=['POST'])
def updateSheet():
    scope = ['https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/drive']
    creds = ServiceAccountCredentials.from_json_keyfile_name('RLRoboticsDB.json', scope)
    client = gspread.authorize(creds)

    teams = {
        "25600X": 1,
        "25600V": 4,
        "25600S": 7,
        "25600Z": 10,
        "25600H": 13,
    }

    teamsheet = client.open('Inventory').worksheet("Teams")

    buffer = request.form["list"].split("|")

    action = buffer.pop(0)
    team = buffer.pop(0)
    col = teams[team]

    current_items = teamsheet.col_values(col)[2:]
    current_ids = teamsheet.col_values(col+1)[2:]
    current_inventory = {}

    for i in range(len(current_items)):
      num = 0
      if len(current_ids) == i:
        num = -1
      else:
        num = current_ids[i]
      current_inventory[current_items[i]] = num
    
    for i in range(len(current_inventory)):
      teamsheet.update_cell(3 + i, col, "")
      teamsheet.update_cell(3 + i, col + 1, "")

    quantity = len(buffer)

    for i in range(quantity):
      data = buffer[i].split(":")
      if action == "checkout":
        if data[0] in current_inventory:
          print("exists")
        else:
          current_inventory[data[0]] = data[1]
      else:
        if data[0] in current_inventory and current_inventory[data[0]] == data[1]:
          current_inventory.pop(data[0])

    it = 0
    for item, num in current_inventory.items():
      teamsheet.update_cell(3 + it, col, item)
      teamsheet.update_cell(3 + it, col + 1, num)
      it += 1
    
    return json.dumps({'status':'OK'})

if __name__ == "__main__":
    app.run()