const express = require('express');
const firebase = require('firebase');
const database = require('../modules/firebase');

const router = express.Router();

/* ILLEGAL access. */
router.get('/', function(req, res, next) {
  res.render('error',{ message : "Error 401 - Unauthorized" });
});

/* GET featured notes. */
router.get('/notes/featured', function(req, res, next) {
  if (!req.isAuthenticated()) {
    res.render('error',{ message : "Error 401 - Unauthorized" });
    return;
  }

  let ref = database.ref("/note_by_dept/")
  ref.orderByChild("upload_time").limitToLast(4).once("value").then(function(snapshot) {
    let notes = snapshot.val();
    let extracted = {};
    for (let dept of Object.keys(notes)) {
      let deptNotes = notes[dept]
      for (let noteID of Object.keys(deptNotes)) {
        extracted[noteID] = deptNotes[noteID]
      }
    }
    res.json(extracted);
  });
});

/* GET notes by department. */
router.get('/notes/:dept', function(req, res, next) {
  if (!req.isAuthenticated()) {
    res.render('error',{ message : "Error 401 - Unauthorized" });
    return;
  }

  let deptID = req.params.dept;
  let ref = database.ref("/note_by_dept/"+deptID);
  ref.once("value").then(function(snapshot) {
    let notes = snapshot.val();
    res.json(notes);
  });
});

/* GET notes by subject number. */
router.get('/notes/number/:subject', function(req, res, next) {
  if (!req.isAuthenticated()) {
    res.render('error',{ message : "Error 401 - Unauthorized" });
    return;
  }

  let subjectID = req.params.subject.toUpperCase();
  let regex = subjectID.match('(^[A-Z0-9]+)\\.[A-Z0-9]+$');
  let deptID = regex[1];
  let ref = database.ref("/note_by_dept/"+deptID)
  ref.orderByChild("number").equalTo(subjectID).once("value").then(function(snapshot) {
    let notes = snapshot.val();
    res.json(notes);
  });
});

/* GET user info by userID. */
router.get('/users/:id', function(req, res, next) {
  if (!req.isAuthenticated()) {
    res.render('error',{ message : "Error 401 - Unauthorized" });
    return;
  }

  let userID = req.params.id;
  let result = {};
  let ref = database.ref("/users/" + userID);

  ref.once("value").then(function(snapshot) {
    let data = snapshot.val();
    result['name'] = data.first_name + " " + data.last_name;
    result['kerbero'] = data.kerbero;
    result['major'] = data.major ? data.major : "";
    result['year'] = data.year ? data.year : "";
    result['introduction'] = data.introduction ? data.introduction : "";

    result['favorites'] = null;
    result['uploads'] = null;
    res.json(result);
  });
});

/* POST profile updates */
router.post('/me/update', function(req, res, next) {
  if (!req.isAuthenticated()) {
    res.render('error',{ message : "Error 401 - Unauthorized" });
    return;
  }

  let userID = req.user.mit_id;
  let newValues = {};

  if (req.body.major) {
		newValues['major'] = req.body.major;
	}
  if (req.body.year) {
    newValues['year'] = req.body.year;
  }
  if (req.body.introduction) {
    newValues['introduction'] = req.body.introduction;
  }

  database.ref("/users/" + userID).update(newValues, function(error) {
    if (error) {
      res.send(error);
    } else {
      res.send("");
    }
  })
})

module.exports = router;
