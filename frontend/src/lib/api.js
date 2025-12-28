import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = {
  // Tasks
  getGrades: () => axios.get(`${API}/tasks/grades`),
  getTopics: (grade) => axios.get(`${API}/tasks/topics/${grade}`),
  getTasks: (grade, topic) => axios.get(`${API}/tasks/${grade}/${encodeURIComponent(topic)}`),
  getTask: (taskId) => axios.get(`${API}/tasks/single/${taskId}`),
  submitAnswer: (taskId, answer) => axios.post(`${API}/tasks/submit`, { task_id: taskId, answer }),

  // Progress
  getProgressOverview: () => axios.get(`${API}/progress/overview`),
  getUserStats: () => axios.get(`${API}/progress/stats`),

  // Daily Challenge
  getDailyChallenge: () => axios.get(`${API}/challenges/daily`),
  submitChallengeAnswer: (challengeId, taskId, answer) => 
    axios.post(`${API}/challenges/submit/${challengeId}`, { task_id: taskId, answer }),

  // Recommendations
  getRecommendations: () => axios.get(`${API}/recommendations`),
  getAIRecommendation: () => axios.get(`${API}/recommendations/ai`),

  // User
  updateGrade: (grade) => axios.put(`${API}/auth/grade?grade=${grade}`),

  // Admin
  getAdminStats: () => axios.get(`${API}/admin/stats`),
  getAllStudents: () => axios.get(`${API}/admin/students`),
  getStudentDetail: (studentId) => axios.get(`${API}/admin/students/${studentId}`),
  getAllTasks: (grade, topic) => {
    let url = `${API}/admin/tasks`;
    const params = new URLSearchParams();
    if (grade) params.append('grade', grade);
    if (topic) params.append('topic', topic);
    if (params.toString()) url += `?${params.toString()}`;
    return axios.get(url);
  },
  createTask: (task) => axios.post(`${API}/admin/tasks`, task),
  updateTask: (taskId, task) => axios.put(`${API}/admin/tasks/${taskId}`, task),
  deleteTask: (taskId) => axios.delete(`${API}/admin/tasks/${taskId}`),
  importTasksCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API}/admin/tasks/import-csv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Seed
  seedDatabase: () => axios.post(`${API}/seed`)
};
