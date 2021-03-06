var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var user = mongoose.model('user');
var LocalStrategy = require('passport-local').Strategy;
var bCrypt = require('bcrypt-nodejs');
var request = require('request');
var cheerio = require('cheerio');
var utils = require('../libs/utils');

var users = {};

module.exports = function(passport){

	var isValidPassword = function(doc, password){
		return bCrypt.compareSync(password, doc.password);
	};

	var createHash = function(password){
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
	};

	passport.serializeUser(function(user, done){
		console.log('usuario serializado: ' + user.username );
		return done(null, user);
	});

	passport.deserializeUser(function(id, done){
		user.findById(id, function(err, doc){
			console.log('deserialize User: ' + doc.username );
			return done(err, doc);
		});		
	});

	passport.use('login', new LocalStrategy({
		passReqToCallback : true
	}, function(req, username, password, done){

		var query = {'username': username};
		
		user
			.findOne(query, function(err, doc){	
				
				if(err)
					return done({error:true, data:false, message:err});				
				if(!doc){
					return done({error:true, data:false, message:'no existe el usuario'});
				}

				if(isValidPassword(doc, password)){
					console.log('password errado!');
					return done({error:true, data:false, message:'password errado!'});
				}
				return done({error:false, data:doc, message:'Exito!'});
			});
	}));

	passport.use('signup', new LocalStrategy({
		passReqToCallback : true
	}, function(req, username, password, done){
				
		var query = {'username': username};

		user
			.findOne(query, function(err, doc){

				if(err){
					console.log('error')
					return done(true, null, 'error')
				}

				if(doc){
					console.log('User already exists')
					return done(true, null, 'User already exists')
				}else{
					console.log('antes del avatar')
					utils.create_avatar(cheerio, request, function(avatar){
						console.log('-------')
						console.log(avatar)
						var newUser = new user();

						newUser.username = username;
						newUser.password = createHash(password);					
						newUser.email = req.body.email;

						if(typeof req.body.admin != 'undefined')
							newUser.admin = req.body.admin;

						if(typeof req.body.distributorLine != 'undefined')
							newUser.distributorLine = req.body.distributorLine;

						if(typeof req.body.location != 'undefined')
							newUser.location = req.body.location;
						
						if(typeof req.body.role != 'undefined')
							newUser.role.push(req.body.role);

						if(avatar!=''){
							newUser.avatar=avatar;
						}

						newUser.save(function(err){
							if(err){
								done(true, null, 'Error saved');
							}
							
							return done(false, newUser, 'Success');
						});
					});
				}
			});
	}));

};