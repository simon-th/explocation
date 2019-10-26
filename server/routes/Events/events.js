const express = require('express');
const geolib = require('geolib');
const convert = require('convert-units');
const Category = require('../../mongodb_schemas/Category');
const Event = require('../../mongodb_schemas/Event');

const router = express.Router();

async function filterEventsByDistance(events, source, distance) {
  var filteredEvents = [];
  events.forEach((e) => {
    const eLat = parseFloat(e.latitude);
    const eLong = parseFloat(e.longitude);
    var d = geolib.getDistance(source, {
      latitude: eLat,
      longitude: eLong
    });
    d = convert(d).from('m').to('mi');
    if (d <= distance) {
      filteredEvents.push(e);
    }
  });
  return filteredEvents;
}

async function filterEventsByDate(events, today, within) {
  var filteredEvents = [];
  events.forEach((e) => {
    var present = new Date(today);
    var start = new Date(e.start_time);
    var end = new Date(e.end_time);
    var target = new Date();
    target.setDate(present.getDate() + within);
    if (((start > present) && (start < target)) || ((end > present) && (end < target))) {
      filteredEvents.push(e);
    }
  });
  return filteredEvents;
}

async function filterEventsByFree(events) {
  var filteredEvents = [];
  events.forEach((e) => {
    if (e.is_free) {
      filteredEvents.push(e);
    }
  })
  return filteredEvents
}

router.get('/test', (req, res) => {
  res.send('events api route works!');
});

router.get('/all', async (req, res) => {
  Event.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

router.get('/categories', async (req, res) => {
  await Category.find()
  .exec()
  .then(data => {
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({message: 'aiya'})
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({error: err});
  });
});

router.get('/category', async (req, res) => {
  await Category.find({ id: req.query.id})
  .exec()
  .then(data => {
    // console.log(data);
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({message: 'aiya'})
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({error: err});
  });
});

router.get('/filter', async (req, res) => {
  try {
    var events = [];
    const id = req.query.category;
    const distance = parseInt(req.query.distance);
    const latitude = parseFloat(req.query.latitude);
    const longitude = parseFloat(req.query.longitude);
    const is_free = req.query.free;
    const today = req.query.today;
    const within = parseInt(req.query.within);
    if (id == 'all') {
      await Event.find()
      .exec()
      .then(data => {
        if (data) events = data;
        else res.status(404).json({message: 'aiya'});
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({error: err});
      });
    } else {
      await Event.find({ 'category_id': id})
      .exec()
      .then(data => {
        if (data) events = data;
        else res.status(404).json({message: 'aiya'});
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({error: err});
      });
    }
    // console.log(is_free instanceof Boolean);
    if (is_free == 'true') events = await filterEventsByFree(events);
    events = await filterEventsByDistance(events, {latitude: latitude, longitude: longitude}, distance);
    events = await filterEventsByDate(events, today, within);
    res.status(200).json(events);
  } catch(error) {
    console.log(error);
  }
});


module.exports = router;