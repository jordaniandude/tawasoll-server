const express = require("express");
const { auth, upload } = require("../utils/index.js");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const normalizeUrl = require("normalize-url");
const Profile = require("../models/Profile.js");
const User = require("../models/User.js");
const Post = require("../models/Post.js");

/*
1.  POST /profiles
2.  GET /profiles/me
3.  GET /profiles
4.  GET /profiles/user/:user_id
5.  DELETE /profiles
6.  POST /profiles/upload
7.  PUT /profiles/experience
8.  DELETE /profiles/experience/:exp_id
9.  PUT /profiles/education
10. DELETE /profiles/education/:edu_id
*/

router.post(
  "/",
  auth,
  check("status", "Status is required").notEmpty(),
  check("skills", "Skills is required").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    /*
    {
"company": “ARAMEX”,
“status”: “Junior Developer”,
“skills”: [”HTML, CSS, PHP, JAVASCRIPT”],
“website”: ”https://www.mywebsite.com“,
“location”:”Dubai”,
“bio”:”I am a software engineer and studied in the Arabic university”,
“github”:””,
“twitter”:””,
“youtube”:””
}
    */

    const {
      website,
      skills,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
      github,
      ...rest
    } = req.body;

    const test = Array.isArray(skills)
      ? skills
      : skills.split(",").map((skill) => skill.trim());
    console.log("TEST", test);
    const profile = {
      user: req.user.id,
      website:
        website && website !== ""
          ? normalizeUrl(website, { forceHttps: true })
          : "",
      skills: Array.isArray(skills)
        ? skills
        : skills.split(",").map((skill) => skill.trim()),
      ...rest,
    };

    const socialFields = {
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
      github,
    };
    for (let key in socialFields) {
      const value = socialFields[key];
      if (value && value != "") {
        socialFields[key] = normalizeUrl(value, { forceHttps: true });
      }
    }

    profile.social = socialFields;

    try {
      let profileObject = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profile },
        { new: true, upsert: true }
      );
      return res.json(profileObject);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send(err.message);
    }
  }
);

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name"]);

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

router.get("/user/:user_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name"]);

    if (!profile) {
      return res
        .status(400)
        .json({ msg: "There is no profile for the given user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

router.delete("/", auth, async (req, res) => {
  // Remove posts, profile, user

  try {
    await Promise.all([
      Post.deleteMany({user: req.user.id}),
      Profile.findOneAndRemove({ user: req.user.id }),
      User.findOneAndRemove({ _id: req.user.id }),
    ]);

    res.json({ msg: "User information is deleted successfully" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

router.post("/upload", auth, async (req, res) => {
  try {
    console.log("inside upload")
    upload(req, res, async (err) => {
      if (err) {
        console.log("Error:"+ err)
        res.status(500).send(`Server Error: ${err}`);
      } else {
        try {
          res.status(200).send(req.user.id);
        } catch (err) {
          console.log(err);
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send(`Server Error: ${err}`);
  }
});

router.put(
  "/experience",
  auth,
  check("title", "Title is required").notEmpty(),
  check("company", "Company is required").notEmpty(),
  check("from", "From date is required and needs to be from the past")
    .notEmpty()
    .custom((value, { req }) => {
      return req.body.to ? value < req.body.to : true;
    }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(req.body);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send(err.message);
    }
  }
);

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    profile.experience = profile.experience.filter(exp => {
      return exp._id.toString() !== req.params.exp_id;
    });
    
    await profile.save();
    return res.json(profile);

  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

router.put(
  "/education",
  auth,
  check("school", "School is required").notEmpty(),
  check("degree", "Degree is required").notEmpty(),
  check("fieldofstudy", "Field of study is required").notEmpty(),
  check("from", "From date is required and needs to be from the past")
    .notEmpty()
    .custom((value, { req }) => {
      return req.body.to ? value < req.body.to : true;
    }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(req.body);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send(err.message);
    }
  }
);

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    profile.education = profile.education.filter(edu => {
      return edu._id.toString() !== req.params.edu_id;
    });
    
    await profile.save();
    return res.json(profile);

  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

module.exports = router;
