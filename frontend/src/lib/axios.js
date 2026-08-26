import axios from 'axios';

// Create an Axios instance configured to talk to our FastAPI backend
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // FastAPI server
  withCredentials: true, // IMPORTANT: This tells the browser to send the HttpOnly cookie!
});

export default api;
