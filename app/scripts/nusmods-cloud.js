'use strict';
// This module serves as a wrapper for the NUSMods Cloud API.
var $ = require('jquery');

var config = require('./common/config');
var userNamespace = config.namespaces.user + ':';
var API_HOST = require('./common/config').apiHost;

module.exports = {
  accessToken: null,
  setAccessToken: function (accessToken) {
    this.accessToken = accessToken;
  },
  removeAccessToken: function () {
    this.accessToken = null;
  },
  auth: function (ivleToken, callback) {
    var that = this;
    if (!callback) {
      return;
    }
    $.ajax({
      url: API_HOST + '/users',
      type: 'post',
      data: {
        ivleToken: ivleToken
      }
    }).done(function (response) {
      that.setAccessToken(response.data.accessToken);
      callback(response.data);
    }).fail(function () {
      alert('Something has went wrong. Please try again later.');
    });
  },
  updateTimetable: function (nusnetId, semester, queryString, callback, failCallback) {
    var that = this;
    $.ajax({
      url: API_HOST + '/users/' + nusnetId + '/timetables',
      type: 'post',
      headers: {
        Authorization: that.accessToken
      },
      data: {
        semester: semester,
        lessons: queryString
      }
    }).done(function (response) {
      if (callback) {
        callback(response.data);
      }
    }).fail(function () {
      alert('Something has went wrong. Please try again later.');
      if (failCallback) {
        failCallback(response.data);
      }
    });
  },
  getTimetable: function (nusnetId, semester, callback) {
    var that = this;
    $.ajax({
      url: API_HOST + '/users/' + nusnetId + '/timetables/' + semester,
      type: 'get',
      headers: {
        Authorization: that.accessToken
      }
    }).done(function (response) {
      if (callback) {
        callback(response.data.lessons);
      }
    }).fail(function () {
      alert('Something has went wrong. Please try again later.');
      if (failCallback) {
        failCallback(response.data);
      }
    });
  },
  getFriends: function (nusnetId, callback) {
    return callback([
    {
      nusnetId: 'a0112345',
      name: 'HONG LU',
      email: 'honglu@u.nus.edu',
      gender: 'Female',
      faculty: 'Faculty of Science',
      firstMajor: 'Quantitative Finance (Hons)',
      secondMajor: '',
      matriculationYear: '2014'
    },
    {
      nusnetId: 'a0113615',
      name: 'LIU XINAN',
      email: 'xinan@u.nus.edu',
      gender: 'Male',
      faculty: 'School of Computing',
      firstMajor: 'Computer Science (Hons)',
      secondMajor: '',
      matriculationYear: '2014'
    },
    {
      nusnetId: 'a0111862',
      name: 'XU BILI',
      email: 'bili@u.nus.edu',
      gender: 'Male',
      faculty: 'School of Computing',
      firstMajor: 'Computer Science (Hons)',
      secondMajor: '',
      matriculationYear: '2014'
    }]);
  },
  getFriendsTimetable: function (nusnetId, semester, callback) {
    return callback([
    {
      nusnetId: 'a0112345',
      name: 'HONG LU',
      email: 'honglu@u.nus.edu',
      gender: 'Female',
      faculty: 'Faculty of Science',
      firstMajor: 'Quantitative Finance (Hons)',
      secondMajor: '',
      matriculationYear: '2014',
      timetable: {
        year: '2015-2016',
        semester: 1,
        queryString: 'CS3210[TUT]=1&CS3210[LEC]=1&CS3216[TUT]=1&CS3216[LEC]=1&CS2105[LEC]=1&CS2105[TUT]=5&LAF3201[TUT]=T6&LAF3201[LEC]=1'
      }
    },
    {
      nusnetId: 'a0113615',
      name: 'LIU XINAN',
      email: 'xinan@u.nus.edu',
      gender: 'Male',
      faculty: 'School of Computing',
      firstMajor: 'Computer Science (Hons)',
      secondMajor: '',
      matriculationYear: '2014',
      timetable: {
        year: '2015-2016',
        semester: 1,
        queryString: 'CS3216[TUT]=1&CS3216[LEC]=1&CS2105[LEC]=1&CS2105[TUT]=5&CS2106[LAB]=2&CS2106[LEC]=1&CS2106[TUT]=7&CS3244[LEC]=1&CS3244[TUT]=1&CS2309[LEC]=1&CS2309[TUT]=2'
      }
    },
    {
      nusnetId: 'a0111862',
      name: 'XU BILI',
      email: 'bili@u.nus.edu',
      gender: 'Male',
      faculty: 'School of Computing',
      firstMajor: 'Computer Science (Hons)',
      secondMajor: '',
      matriculationYear: '2014',
      timetable: {
        year: '2015-2016',
        semester: 1,
        queryString: 'CS3216[TUT]=1&CS3216[LEC]=1&CS2103T[TUT]=C02&CS2101[SEC]=1&CS2104[LEC]=1&CS2104[TUT]=2&CS3230[LEC]=2'
      }
    }]);
  },
  addFriend: function (nusnetId, friendNusnetId, callback) {
    return callback({
      status: 'success'
    });
  },
  unfriend: function (nusnetId, friendNusnetId, callback) {
    return callback({
      status: 'success'
    });
  },
  getPendingFriendRequestsReceived: function (nusnetId, callback) {
    return callback([
    {
      nusnetId: 'a0112345',
      name: 'HONG LU',
      email: 'honglu@u.nus.edu',
      gender: 'Female',
      faculty: 'Faculty of Science',
      firstMajor: 'Quantitative Finance (Hons)',
      secondMajor: '',
      matriculationYear: '2014'
    },
    {
      nusnetId: 'a0113615',
      name: 'LIU XINAN',
      email: 'xinan@u.nus.edu',
      gender: 'Male',
      faculty: 'School of Computing',
      firstMajor: 'Computer Science (Hons)',
      secondMajor: '',
      matriculationYear: '2014'
    },
    {
      nusnetId: 'a0111862',
      name: 'XU BILI',
      email: 'bili@u.nus.edu',
      gender: 'Male',
      faculty: 'School of Computing',
      firstMajor: 'Computer Science (Hons)',
      secondMajor: '',
      matriculationYear: '2014'
    }]);
  },
  getPendingFriendRequestsSent: function (nusnetId, callback) {
    return callback([
    {
      nusnetId: 'a0112345'
    },
    {
      nusnetId: 'a0113615'
    },
    {
      nusnetId: 'a0111862'
    }]);
  },
  acceptFriendRequest: function (nusnetId, friendNusnetId, callback) {
    return callback({
      status: 'success'
    });
  },
  rejectFriendRequest: function (nusnetId, friendNusnetId, callback) {
    return callback({
      status: 'success'
    });
  },
  cancelFriendRequest: function (nusnetId, friendNusnetId, callback) {
    return callback({
      status: 'success'
    });
  }
};