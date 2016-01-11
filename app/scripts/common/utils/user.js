'use strict';

var $ = require('jquery');
var _ = require('underscore');
var Promise = require('bluebird'); // jshint ignore:line

var config = require('../config');
var localforage = require('localforage');

var nusmodsCloud = require('../../nusmods-cloud');
var semTransformer = require('./semTransformer');
var userNamespace = config.namespaces.user + ':';

var IVLE_LAPI_KEY = config.IVLE.LAPIKey;

module.exports = {
  ivleDialog: null,
  userProfile: null,
  getLoginStatus: function (callback) {
    var that = this;
    return new Promise(function (resolve) {
      var fn = callback ? callback : resolve;

      if (that.userProfile) {
        fn({ loggedIn: true, userProfile: that.userProfile });
        return;
      }

      localforage.getItem(userNamespace + 'profile', function (userProfile) {
        if (userProfile && userProfile.nusnetId && userProfile.accessToken) {
          nusmodsCloud.setAccessToken(userProfile.accessToken);
          nusmodsCloud.getTimetable(userProfile.nusnetId, semTransformer.NUSModsYearSemToCloudSem(config.academicYear, config.semester),
            function (cloudTimetable) {
              that.userProfile = userProfile;
              that
                .syncLocalTimetableWithCloud(config.semester, cloudTimetable)
                .then(function () {
                  fn({ loggedIn: true, userProfile: userProfile });
                });
            },
            function () {
              that.logout();
              fn({ loggedIn: false });
            }
          );
        } else {
          fn({ loggedIn: false });
        }
      });
    });
  },
  login: function (callback) {
    var that = this;

    return new Promise(function (resolve) {
      var fn = callback ? callback : resolve;
      if (that.ivleDialog === null || that.ivleDialog.closed) {
        var w = 255;
        var h = 210;
        var left = (screen.width / 2) - (w / 2);
        var top = (screen.height / 3) - (h / 2);
        var options = 'dependent, toolbar=no, location=no, directories=no, ' +
                      'status=no, menubar=no, scrollbars=no, resizable=no, ' +
                      'copyhistory=no, width=' + w + ', height=' + h +
                      ', top=' + top + ', left=' + left;

        window.ivleLoginSuccessful = function (ivleToken) {
          nusmodsCloud.auth(ivleToken, function (userProfile) {
            localforage.setItem(userNamespace + 'profile', _.omit(userProfile, 'timetables'));
            that.userProfile = userProfile;
            var index = _.findIndex(userProfile.timetables, function (timetable) {
              return timetable.semester === config.currentSemester;
            });
            var cloudTimetable = index === -1 ? '' : userProfile.timetables[index].lessons;
            that.syncLocalTimetableWithCloud(config.semester, cloudTimetable);
            fn({ loggedIn: true, userProfile: userProfile });
            window.ivleLoginSuccessful = undefined;
          });
        };

        var callbackUrl = window.location.protocol + '//' + window.location.host + '/ivlelogin.html';
        var popUpUrl = 'https://ivle.nus.edu.sg/api/login/?apikey=' + IVLE_LAPI_KEY + '&url=' + callbackUrl;
        that.ivleDialog = window.open(popUpUrl, '', options);
      } else {
        that.ivleDialog.focus();
      }
    });
  },
  logout: function () {
    localforage.removeItem(userNamespace + 'profile');
    this.userProfile = null;
  },
  syncLocalTimetableWithCloud: function (semester, cloudTimetable) {
    var that = this;
    return new Promise(function (resolve, reject) {
      localforage
        .getItem(config.semTimetableFragment(semester) + ':queryString')
        .then(function (localTimetable) {
          var shouldOverwriteLocal = false;
          if (localTimetable) {
            // Existing local timetable exists
            console.log('cloud timetable:', cloudTimetable);
            console.log('local timetable:', localTimetable);
            if (cloudTimetable !== localTimetable) {
              // Existing Cloud timetable is different from existing local timetable
              shouldOverwriteLocal = !window.confirm('Timetable saved online by NUSMods ' +
                                                'is different from current one. Overwrite ' +
                                                'online saved timetable with current timetable?');
            } else {
              // Cloud timetable same as local timetable. No op.
              console.log('Cloud timetable same as local timetable, no-op');
              return resolve();
            }
          } else {
            console.log('No existing local timetable');
            shouldOverwriteLocal = true;
          }

          if (shouldOverwriteLocal) {
            console.log('Will overwrite local timetable with cloud timetable');
            localforage.setItem(config.semTimetableFragment(semester) + ':queryString', cloudTimetable,
              function () {
                window.location.href = '/';
              });
          } else {
            console.log('Will overwrite cloud timetable with local timetable');
            that.updateTimetable(semester, localTimetable,
              function () {
                alert('Timetable saved to cloud!');
                resolve();
              },
              function () {
                alert('Error saving timetable to cloud!');
                reject();
              }
            );
          }
        });
    });
  },
  getUser: function (callback) {
    var that = this;
    return new Promise(function (resolve) {
      var fn = callback ? callback : resolve;
      if (that.userProfile) {
        fn(userProfile);
        return;
      }
      localforage.getItem(userNamespace + 'profile', function (userProfile) {
        fn(userProfile);
      });
    });
  },
  updateTimetable: function (semester, timetable, callback, failCallback) {
    var that = this;
    return new Promise(function (resolve, reject) {
      var fn = callback ? callback : resolve;
      var failFn = failCallback ? failCallback : reject;
      if (!that.userProfile || !that.userProfile.nusnetId) {
        failFn();
      }
      nusmodsCloud.updateTimetable(that.userProfile.nusnetId,
        semTransformer.NUSModsYearSemToCloudSem(config.academicYear, semester),
        timetable,
        fn,
        failFn
      );
    });
  },
  getFriends: function (callback) {
    if (!this.userProfile) {
      alert('Login first!');
      return;
    }
    var that = this;
    return new Promise(function (resolve) {
      var fn = callback ? callback : resolve;
      nusmodsCloud.getFriends(that.userProfile.nusnetId, fn);
    });
  },
  getFriendsTimetable: function (callback) {
    if (!this.userProfile) {
      alert('Login first!');
      return;
    }
    var that = this;
    return new Promise(function (resolve) {
      var fn = callback ? callback : resolve;
      nusmodsCloud.getFriendsTimetable(that.userProfile.nusnetId, '2015-2016/sem1', fn);
    });
  },
  addFriend: function (friendNusnetId, callback) {
    if (!this.userProfile) {
      alert('Login first!');
      return;
    }
    var that = this;
    return new Promise(function (resolve) {
      var fn = callback ? callback : resolve;
      nusmodsCloud.addFriend(that.userProfile.nusnetId, friendNusnetId, fn);
    });
  },
  unfriend: function (friendNusnetId, callback) {
    if (!this.userProfile) {
      alert('Login first!');
      return;
    }
    var that = this;
    return new Promise(function (resolve) {
      var fn = callback ? callback : resolve;
      nusmodsCloud.unfriend(that.userProfile.nusnetId, friendNusnetId, fn);
    });
  },
  getPendingFriendRequestsReceived: function (callback) {
    if (!this.userProfile) {
      alert('Login first!');
      return;
    }
    var that = this;
    return new Promise(function (resolve) {
      var fn = callback ? callback : resolve;
      nusmodsCloud.getPendingFriendRequestsReceived(that.userProfile.nusnetId, fn);
    });
  },
  getPendingFriendRequestsSent: function (callback) {
    if (!this.userProfile) {
      alert('Login first!');
      return;
    }
    var that = this;
    return new Promise(function (resolve) {
      var fn = callback ? callback : resolve;
      nusmodsCloud.getPendingFriendRequestsSent(that.userProfile.nusnetId, fn);
    });
  },
  acceptFriendRequest: function (friendNusnetId, callback) {
    if (!this.userProfile) {
      alert('Login first!');
      return;
    }
    var that = this;
    return new Promise(function (resolve) {
      var fn = callback ? callback : resolve;
      nusmodsCloud.acceptFriendRequest(that.userProfile.nusnetId, friendNusnetId, fn);
    });
  },
  rejectFriendRequest: function (friendNusnetId, callback) {
    if (!this.userProfile) {
      alert('Login first!');
      return;
    }
    var that = this;
    return new Promise(function (resolve) {
      var fn = callback ? callback : resolve;
      nusmodsCloud.rejectFriendRequest(that.userProfile.nusnetId, friendNusnetId, fn);
    });
  },
  cancelFriendRequest: function (friendNusnetId, callback) {
    if (!this.userProfile) {
      alert('Login first!');
      return;
    }
    var that = this;
    return new Promise(function (resolve) {
      var fn = callback ? callback : resolve;
      nusmodsCloud.cancelFriendRequest(that.userProfile.nusnetId, friendNusnetId, fn);
    });
  }
}