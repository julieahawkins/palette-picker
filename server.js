// imports express
const express = require('express');
// imports bodyParser
const bodyParser = require('body-parser');
// imports path
const path = require('path');
// creates a new instance of express assigned to the const app
const app = express();

//sets the environment to NODE_ENV or development as fallback
const environment = process.env.NODE_ENV || 'development';
// grabs the config from knexfile using the environment set above
const config = require('./knexfile')[environment];
// passes the config to the knex function to configure the database settings
const database = require('knex')(config);


// helper function to check the params of request bodies coming in, 
// takes in body and required prop
function checkParams(body, prop) {
  // execute inner code for every prop in array
  for (let requiredParameter of [ prop ]) {
    // if the requiredParameter is not a prop of the body...
    if (!body[requiredParameter]) {
      // return an obj with propsFound as false and the requiredParam
      return { propsFound: false, requiredParameter }
    }
  }
  // if the return above is hit, return an obj with propsFound as true
  return { propsFound: true }
};

// set the port of the app to PORT or 3000 as fallback
app.set('port', process.env.PORT || 3000);

// allow the app the use bodyParser to parse json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// allow app to use the public directory as its source path
app.use(express.static(path.join(__dirname, 'public')));

// assign the local title of the app as 'palette-picker'
app.locals.title = 'palette-picker';

// GET ENDPOINT FOR ALL PROJECTS
app.get('/api/v1/projects', (request, response) => {
  // select all from the database called 'projects'
  database('projects').select()
    // send a response back with the status 200 and all of the projects in json
    .then(projects => {
      return response.status(200).json({ projects });
    })
    // if an error is caught, send a response with status 500 and the error in json
    .catch(error => {
      return response.status(500).json({ error });
    });
});

// GET ENDPOINT FOR ALL PALETTES IN A PROJECT
app.get('/api/v1/projects/:id/palettes', (request, response) => {
  // grab id from request params
  const { id } = request.params;

  // select all palettes from the palettes database 
  // where the project id matches the id from request params
  database('palettes').where('project_id', id).select()
    // send a response back with the status 200 and all of the palettes that match the params
    .then(palettes => {
      return response.status(200).json({ palettes });
    })
    // if an error is caught, send a response with status 500 and the error in json
    .catch(error => {
      return response.status(500).json({ error });
    });
});

// POST ENDPOINT TO CREATE A NEW PROJECT
app.post('/api/v1/projects', (request, response) => {
  // grab project from request body
  const project = request.body;
  
  // run helper file to check for required params
  const result = checkParams(project, 'title');

  // if required props not found...
  if (!result.propsFound) {
    // send a response of 422 and and error message
    return response.status(422).json({ 
      error: `You are missing ${result.requiredParameter}` 
    });
  }

  // if above check passes, insert into database called projects, the project by its id
  database('projects').insert(project, 'id')
    // send a response back with the status 201 and the id of the project posted
    .then(project => {
      return response.status(201).json({ id: project[0] });
    })
    // if an error is caught, send a response with status 500 and the error in json
    .catch(error => {
      return response.status(500).json({ error });
    });
});

// POST ENDPOINT TO CREATE A NEW PALETTE
app.post('/api/v1/projects/:id/palettes', (request, response) => {
  // grab id from request params 
  const { id } = request.params;
  // assign project_id to palette
  const palette = Object.assign({}, request.body, { project_id: id });
  // run helper file to check for required params 
  const result = checkParams(palette, 'title');
  
  // if required props not found...
  if (!result.propsFound) {
    // send a response of 422 and error message
    return response.status(422).json({ 
      error: `You are missing ${result.requiredParameter}` 
    });
  }

  // if above check passes, insert into database called palettes, by id
  database('palettes').insert(palette, 'id')
    // send back a response of 201 and the id of the posted palette
    .then(palette => {
      return response.status(201).json({ id: palette[0] });
    })
    // if an error is caught, send back a response with the status 500 and the error
    .catch(error => {
      return response.status(500).json({ error });
    });
});

// DELETE ENDPOINT TO DESTROY A PALETTE
app.delete('/api/v1/projects/:projectID/palettes/:id', (request, response) => {
  // grab projectID and id from request params
  const { projectID, id } = request.params;
  
  // delete the palette from the database called palettes where the id of the project and pallete matches the params
  database('palettes').where('project_id', projectID).where('id', id).del()
    // send back a response of 204 and the resulting json
    .then(result => {
      return response.status(204).json({ result });
    })
    // if an error is caught, send back a response with the status 500 and the error
    .catch(error => {
      return response.status(500).json({ error });
    });
});

// app will listen at the port that is is running on
app.listen(app.get('port'), () => {
  //log a string that reports the title of the app and the port it is running on
  console.log(`${app.locals.title} is running on ${app.get('port')}.`);
});

// export app
module.exports = app;
