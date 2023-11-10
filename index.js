const express = require('express');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = 8000;


// Set up multer to handle file uploads
//http://localhost:8000/UploadForm.html
const upload = multer({ dest: 'uploads/' });

// Middleware to handle JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Serve the HTML form
app.get('/UploadForm.html', (req, res) => {
  res.sendFile(__dirname + '/static/UploadForm.html');
});

// Define the route for uploading a note
app.post('/upload', upload.fields([{ name: 'note_name' }, { name: 'note' }]), (req, res) => {
  //const { note_name, note } = req.body;
  const note_name = req.body.note_name;
  const note = req.body.note;

  if (!note_name || !note) {
    res.status(400).json({ error: 'Missing note_name or note field' });
    return;
  }

  // Read existing notes from a JSON file
  let notes = [];
  try {
    const notesData = fs.readFileSync('notes.json', 'utf-8');
    notes = JSON.parse(notesData);
  } catch (err) {
    
  }

  // Check if a note with the same name already exists
  const existingNote = notes.find((n) => n.note_name === note_name);
  if (existingNote) {
    res.status(400).json({ error: 'Note with the same name already exists' });
    return;
  }

  // Add the new note to the array
  notes.push({ note_name, note });

  // Write the updated notes back to the JSON file
  fs.writeFileSync('notes.json', JSON.stringify(notes, null, 2));

  const htmlResponse = `
  <!DOCTYPE html>
  <html>
    <body>
      <h2>Note Created</h2>
      <p>Note Name: ${note_name}</p>
      <p>Note Text ${note}</p>
    </body>
  </html>
`;

res.status(201).send(htmlResponse);
});

// Define the route for retrieving all notes
app.get('/notes', (req, res) => {
  let notes = [];
  try {
    const notesData = fs.readFileSync('notes.json', 'utf-8');
    notes = JSON.parse(notesData);
  } catch (err) {
    res.sendStatus(404);
  }
  res.json(notes);
});

const readNotesFromFile = () => {
  try {
    const notesData = fs.readFileSync('notes.json', 'utf-8');
    return JSON.parse(notesData);
  } catch (err) {
    console.error('Error reading notes from file:', err);
    return [];
  }
};
const writeNotesToFile = (notes) => {
  try {
    const notesData = JSON.stringify(notes, null, 2);
    fs.writeFileSync('notes.json', notesData, 'utf-8');
  } catch (err) {
    // Handle file write error, e.g., log the error or send an error response
    console.error('Error writing notes to file:', err);
  }
};
app.get('/notes/:noteName', (req, res) => {
    const noteName = req.params.noteName;
    const notes = readNotesFromFile(); 
    const note = notes.find((n) => n.note_name === noteName);
  
    if (note) {
      const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <body>
          <h2>Note Finded</h2>
          <p>Note Name: ${note.note_name}</p>
          <p>Note Text ${note.note}</p>
        </body>
      </html>
    `;
      res.send(htmlResponse);
    } else {
      res.status(404).json({ error: 'Note not found' });
    }
  });
app.put('/notes/:noteName', (req, res) => {
    const noteName = req.params.noteName;
    const updatedNoteText = req.body.noteText;
    const notes = readNotesFromFile(); // Implement a function to read notes from the JSON file
    const noteIndex = notes.findIndex((n) => n.note_name === noteName);
  
    if (noteIndex !== -1) {
      notes[noteIndex].note = updatedNoteText;
      writeNotesToFile(notes); // Implement a function to write notes back to the JSON file
      res.json({ message: 'Note updated successfully' });
    } else {
      res.status(404).json({ error: 'Note not found' });
    }
  });
  app.delete('/notes/:noteName', (req, res) => {
    const noteName = req.params.noteName;
    let notes = readNotesFromFile();
    const initialLength = notes.length;
  
    notes = notes.filter((n) => n.note_name !== noteName);
  
    if (notes.length < initialLength) {
      try {
        
        writeNotesToFile(notes); 
        res.json({ message: 'Note deleted successfully' });
      } catch (error) {
        console.error('Error writing notes to file:', error);
        res.status(500).json({ error: ' Server Error' });
      }
    } else {
      res.status(404).json({ error: 'Note not found' });
    }
  });
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
