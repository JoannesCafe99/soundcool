const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const connection = require("../db");
const utils = require("../utils");
var cTimeStamp = new Date().getTime();
var fs = require("fs");

const jwtToken = process.env.JWT_SECRET ? process.env.JWT_SECRET : "soundcool";
const database = process.env.MYSQL_HOST ? "mysql" : "sqlite";

function updateTimeStamp() {
  cTimeStamp = new Date().getTime();
}

const SELECT_ALL_PROJECTS_QUERY = "SELECT * FROM projects ";

router.get("/get", (req, res) => {
  var user = jwt.verify(req.headers["x-auth-token"], jwtToken);
  const user_id = user.id;
  var QUERY = `select *,(CASE WHEN user=${user_id} THEN 0 ELSE user END)as isOwner from projects where user=${user_id} or sharedUsers like '%"user_id":${user_id}%' or isPublic =true order by project_id desc`;

  // do the query case on the user
  if (!!req.query.limit) {
    QUERY += ` limit ${req.query.limit}`;
  }

  if (database == "mysql") {
    connection.query(QUERY, (err, results) => {
      if (err) {
        console.log(err);
        return res.json({ err: err });
      } else {
        return res.json(results);
      }
    });
  } else if (database == "sqlite") {
    connection.all(QUERY, [], (err, results) => {
      if (err) {
        console.log(err);
        return res.json({ err: err });
      } else {
        return res.json(results);
      }
    });
  }
});

router.get("/project", (req, res) => {
  console.log("*********** " + JSON.stringify(req.query));
  const projectId = req.query.projectId;
  const token = req.headers["x-auth-token"];
  utils.verifyToken(token, user => {
    if (user) {
      var projID_SQL = projectId; 
      if (projectId === "undefined") {
        projID_SQL = -1;
      }
      const QUERY = `select *,(CASE WHEN user=${user.id} THEN 0 ELSE user END)as isOwner from projects where (user=${user.id} or sharedUsers like '%"user_id":${user.id}%' or isPublic =true) and project_id = ${projID_SQL}`;
      
      if (database == "mysql") {
        connection.query(QUERY, (err, results) => {
          console.log("*********** " + JSON.stringify(results));
          if (err) {
            console.log(err);
            return res.json({ err: err });
          } else {
            
            return res.json(results[0]);
          }
        });
      } else if (database == "sqlite") {
        connection.all(QUERY, [], (err, results) => {
          console.log("*********** " + JSON.stringify(results));
          if (err) {
            console.log(err);
            return res.json({ err: err });
          } else {
            return res.json(results[0]);
          }
        });
      }
    } else {
      return res.status(401).json({ message: "Token Not Valid" });
    }
  });
});

router.patch("/update", (req, res) => {
  var user = jwt.verify(req.headers["x-auth-token"], jwtToken);
  const user_id = user.id;
  const { content, projectId } = req.body;
  const QUERY = `UPDATE projects SET content = '${content}' WHERE (user = '${user_id}' or sharedUsers like '%"user_id":${user_id}%') and project_id = '${projectId}'`;
  if (database == "mysql") {
    connection.query(QUERY, (err, results) => {
      if (err) {
        console.log(err);
        return res.json({ err: err });
      } else {
        return res.json({
          message: "Project Updated successfully"
        });
      }
    });
  } else if (database == "sqlite") {
    connection.run(QUERY, [], function(err) {
      if (err) {
        console.log(err);
        return res.json({ err: err });
      } else {
        return res.json({
          message: "Project Updated successfully"
        });
      }
    });
  }
});

router.post("/new", (req, res) => {
  var user = jwt.verify(req.headers["x-auth-token"], jwtToken);
  const user_id = user.id;
  const { projectName, projectDescription, blocks } = req.body;
  let error = "";
  if (blocks["bs"].length == 0) {
    error = "Project is Empty";
    return res.json({ error });
  } else if (projectName == "") {
    return res.json({ error });
  } else {
    let content = JSON.stringify(blocks);
    const QUERY = `INSERT INTO projects(user,name,description,content) values('${user_id}','${projectName}','${projectDescription}','${content}')`;
    if (database == "mysql") {
      connection.query(QUERY, (err, results) => {
        if (err) {
          return res.json({ error: err });
        } else {
          const QUERY =
            SELECT_ALL_PROJECTS_QUERY +
            `WHERE project_id = ${results.insertId}`;
          connection.query(QUERY, (err, results) => {
            if (err) {
              return res.json({ error: err });
            } else {
              return res.json(results[0]);
            }
          });
        }
      });
    } else if (database == "sqlite") {
      connection.run(QUERY, [], function(err) {
        if (err) {
          return res.json({ error: err });
        } else {
          const QUERY =
            SELECT_ALL_PROJECTS_QUERY + `WHERE project_id = ${this.lastID}`;
          connection.all(QUERY, [], (err, results) => {
            if (err) {
              return res.json({ error: err });
            } else {
              return res.json(results[0]);
            }
          });
        }
      });
    }
  }
});

router.post("/clone", (req, res) => {
  var user = jwt.verify(req.headers["x-auth-token"], jwtToken);
  const user_id = user.id;
  const { projectId } = req.body;
  const QUERY = `select * from projects where project_id = ${projectId}`;
  let projectName;
  let projectDescription;
  let content;
  if (database == "mysql") {
    connection.query(QUERY, (err, projects) => {
      if (err) {
        return res.json({ err: err });
      } else {
        if (projects[0] && projects[0]["content"]) {
          projectName = projects[0]["name"];
          projectDescription = projects[0]["description"];
          project = JSON.parse(projects[0]["content"]);
          project.bs.forEach(block => {
            if (block["file"]) {
              const QUERY = `select fileLocation,name from sounds where sound_id = ${
                block["file"]["sound_id"]
              }`;
              connection.query(QUERY, (err, result) => {
                if (err) {
                  console.log(err);
                  return res.json({ err: err });
                } else {
                  let oldValue = result[0]["fileLocation"];
                  result[0]["fileLocation"] =
                    "/uploads/sounds/" + cTimeStamp + "-" + result[0]["name"];

                  fs.copyFileSync(
                    "." + oldValue,
                    "." + result[0]["fileLocation"],
                    err => {
                      if (err) throw err;
                    }
                  );

                  const QUERY = `insert into sounds(user,name,fileLocation) values(${user_id},'${
                    block["file"]["name"]
                  }','${result[0]["fileLocation"]}')`;
                  connection.query(QUERY, (err, results) => {
                    if (err) {
                      return res.json({ err: err });
                    } else {
                    }
                  });
                  updateTimeStamp();
                }
              });
            }
          });
          content = JSON.stringify(project);
        }
        const CREATE_NEW_PROJECT = `INSERT INTO projects(user,name,description,content) values('${user_id}','${projectName}','${projectDescription}','${content}')`;
        // do the query case on the user
        const QUERY = CREATE_NEW_PROJECT;
        connection.query(QUERY, (err, results) => {
          if (err) {
            return res.json({ err: err });
          } else {
            const QUERY =
              SELECT_ALL_PROJECTS_QUERY +
              `WHERE project_id = ${results.insertId}`;
            connection.query(QUERY, (err, results) => {
              if (err) {
                return res.json({ err: err });
              } else {
                return res.json(results[0]);
              }
            });
          }
        });
      }
    });
  } else if (database == "sqlite") {
    connection.all(QUERY, [], (err, projects) => {
      if (err) {
        return res.json({ err: err });
      } else {
        if (projects[0] && projects[0]["content"]) {
          projectName = projects[0]["name"];
          projectDescription = projects[0]["description"];
          project = JSON.parse(projects[0]["content"]);
          project.bs.forEach(block => {
            if (block["file"]) {
              const QUERY = `select fileLocation,name from sounds where sound_id = ${
                block["file"]["sound_id"]
              }`;
              connection.all(QUERY, [], (err, result) => {
                if (err) {
                  console.log(err);
                  return res.json({ err: err });
                } else {
                  let oldValue = result[0]["fileLocation"];
                  result[0]["fileLocation"] =
                    "/uploads/sounds/" + cTimeStamp + "-" + result[0]["name"];

                  fs.copyFileSync(
                    "." + oldValue,
                    "." + result[0]["fileLocation"],
                    err => {
                      if (err) throw err;
                    }
                  );

                  const QUERY = `insert into sounds(user,name,fileLocation) values(${user_id},'${
                    block["file"]["name"]
                  }','${result[0]["fileLocation"]}')`;
                  connection.run(QUERY, [], function(err) {
                    if (err) {
                      return res.json({ err: err });
                    } else {
                    }
                  });
                  updateTimeStamp();
                }
              });
            }
          });
          content = JSON.stringify(project);
        }
        const CREATE_NEW_PROJECT = `INSERT INTO projects(user,name,description,content) values('${user_id}','${projectName}','${projectDescription}','${content}')`;
        // do the query case on the user
        const QUERY = CREATE_NEW_PROJECT;
        connection.run(QUERY, [], function(err) {
          if (err) {
            return res.json({ err: err });
          } else {
            const QUERY =
              SELECT_ALL_PROJECTS_QUERY + `WHERE project_id = ${this.lastID}`;
            connection.all(QUERY, [], (err, results) => {
              if (err) {
                return res.json({ err: err });
              } else {
                return res.json(results[0]);
              }
            });
          }
        });
      }
    });
  }
});

router.patch("/remove", (req, res) => {
  var user = jwt.verify(req.headers["x-auth-token"], jwtToken);
  const user_id = user.id;
  const { projectId } = req.body;
  const DELETE_PROJECT = `DELETE FROM projects WHERE user = '${user_id}' and project_id = '${projectId}'`;
  // do the query case on the user
  const QUERY = DELETE_PROJECT;
  if (database == "mysql") {
    connection.query(QUERY, (err, results) => {
      if (err) {
        console.log(err);
        return res.json({ err: err });
      } else {
        return res.json({
          message: "Project Removed successfully"
        });
      }
    });
  } else if (database == "sqlite") {
    connection.run(QUERY, [], function(err) {
      if (err) {
        console.log(err);
        return res.json({ err: err });
      } else {
        return res.json({
          message: "Project Removed successfully"
        });
      }
    });
  }
});

router.patch("/addShare", (req, res) => {
  const { userName, projectId, userEmail } = req.body;
  let QUERY;
  if (userName) QUERY = `select * from users WHERE name = '${userName}'`;
  else QUERY = `select * from users WHERE email = '${userEmail}'`;
  if (database == "mysql") {
    connection.query(QUERY, (err, users) => {
      if (err) {
        return res.json({ err: err });
      } else {
        if (users[0]) {
          const QUERY = `select user,sharedUsers from projects WHERE project_id = ${projectId}`;
          connection.query(QUERY, (err, results) => {
            if (err) {
              return res.json({ err: err });
            } else {
              if (results[0]["user"] != users[0]["user_id"]) {
                var sharedUsers = results[0]["sharedUsers"];
                if (sharedUsers) {
                  sharedUsers = JSON.parse(sharedUsers);
                } else {
                  sharedUsers = { users: [] };
                }
                sharedUsers["users"].push({
                  user_id: users[0].user_id,
                  name: users[0].name,
                  email: users[0].email
                });
                sharedUsers = JSON.stringify(sharedUsers);
                const QUERY = `UPDATE projects SET sharedUsers = '${sharedUsers}' WHERE project_id = ${projectId}`;
                connection.query(QUERY, (err, results) => {
                  if (err) {
                    return res.json({ err: err });
                  } else {
                    return res.json({
                      data: sharedUsers,
                      message: "Project Shared successfully"
                    });
                  }
                });
              } else {
                return res.json({
                  message: "User is the owner of the project"
                });
              }
            }
          });
        } else {
          return res.json({
            message: "User not found"
          });
        }
      }
    });
  } else if (database == "sqlite") {
    connection.all(QUERY, [], (err, users) => {
      if (err) {
        return res.json({ err: err });
      } else {
        if (users[0]) {
          const QUERY = `select user,sharedUsers from projects WHERE project_id = ${projectId}`;
          connection.all(QUERY, [], (err, results) => {
            if (err) {
              return res.json({ err: err });
            } else {
              if (results[0]["user"] != users[0]["user_id"]) {
                var sharedUsers = results[0]["sharedUsers"];
                if (sharedUsers) {
                  sharedUsers = JSON.parse(sharedUsers);
                } else {
                  sharedUsers = { users: [] };
                }
                sharedUsers["users"].push({
                  user_id: users[0].user_id,
                  name: users[0].name,
                  email: users[0].email
                });
                sharedUsers = JSON.stringify(sharedUsers);
                const QUERY = `UPDATE projects SET sharedUsers = '${sharedUsers}' WHERE project_id = ${projectId}`;
                connection.run(QUERY, [], function(err) {
                  if (err) {
                    return res.json({ err: err });
                  } else {
                    return res.json({
                      data: sharedUsers,
                      message: "Project Shared successfully"
                    });
                  }
                });
              } else {
                return res.json({
                  message: "User is the owner of the project"
                });
              }
            }
          });
        } else {
          return res.json({
            message: "User not found"
          });
        }
      }
    });
  }
});

router.patch("/removeShare", (req, res) => {
  const { projectId, sharedUsers } = req.body;
  const QUERY = `UPDATE projects SET sharedUsers = '${sharedUsers}' WHERE project_id = ${projectId}`;
  if (database == "mysql") {
    connection.query(QUERY, (err, results) => {
      if (err) {
        return res.json({ err: err });
      } else {
        return res.json({
          data: sharedUsers,
          message: "User removed successfully"
        });
      }
    });
  } else if (database == "sqlite") {
    connection.run(QUERY, [], function(err) {
      if (err) {
        return res.json({ err: err });
      } else {
        return res.json({
          data: sharedUsers,
          message: "User removed successfully"
        });
      }
    });
  }
});

router.patch("/setPublic", (req, res) => {
  const { projectId, isPublic } = req.body;
  const QUERY = `UPDATE projects SET isPublic = ${isPublic} WHERE project_id = ${projectId}`;
  if (database == "mysql") {
    connection.query(QUERY, (err, results) => {
      if (err) {
        return res.json({ err: err });
      } else {
        return res.json({
          message: isPublic
            ? "Project visibility is set to public"
            : "Project visibility is set to shared only"
        });
      }
    });
  } else if (database == "sqlite") {
    connection.run(QUERY, [], function(err) {
      if (err) {
        return res.json({ err: err });
      } else {
        return res.json({
          message: isPublic
            ? "Project visibility is set to public"
            : "Project visibility is set to shared only"
        });
      }
    });
  }
});

module.exports = router;
