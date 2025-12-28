import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, Pencil, Trash2, Upload, ArrowLeft, Search, 
  Filter, BarChart3, ClipboardList, UserCircle, LogOut
} from 'lucide-react';

export default function TaskManagement() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    grade: '',
    topic: '',
    question: '',
    task_type: 'free_text',
    options: '',
    correct_answer: '',
    explanation: '',
    xp_reward: 10,
    difficulty: 'mittel'
  });

  useEffect(() => {
    loadTasks();
  }, [filterGrade, filterTopic]);

  useEffect(() => {
    if (filterGrade) {
      loadTopics(filterGrade);
    }
  }, [filterGrade]);

  const loadTasks = async () => {
    try {
      const response = await api.getAllTasks(
        filterGrade || null,
        filterTopic || null
      );
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Fehler beim Laden der Aufgaben');
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async (grade) => {
    try {
      const response = await api.getTopics(grade);
      setTopics(response.data.topics);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const handleCreate = () => {
    setSelectedTask(null);
    setFormData({
      grade: '',
      topic: '',
      question: '',
      task_type: 'free_text',
      options: '',
      correct_answer: '',
      explanation: '',
      xp_reward: 10,
      difficulty: 'mittel'
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setFormData({
      grade: task.grade.toString(),
      topic: task.topic,
      question: task.question,
      task_type: task.task_type,
      options: task.options?.join('|') || '',
      correct_answer: task.correct_answer,
      explanation: task.explanation,
      xp_reward: task.xp_reward,
      difficulty: task.difficulty
    });
    loadTopics(task.grade);
    setIsDialogOpen(true);
  };

  const handleDelete = (task) => {
    setSelectedTask(task);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.deleteTask(selectedTask.id);
      toast.success('Aufgabe gelöscht');
      loadTasks();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const taskData = {
      grade: parseInt(formData.grade),
      topic: formData.topic,
      question: formData.question,
      task_type: formData.task_type,
      options: formData.task_type === 'multiple_choice' && formData.options 
        ? formData.options.split('|').map(o => o.trim()) 
        : null,
      correct_answer: formData.correct_answer,
      explanation: formData.explanation,
      xp_reward: parseInt(formData.xp_reward),
      difficulty: formData.difficulty
    };

    try {
      if (selectedTask) {
        await api.updateTask(selectedTask.id, taskData);
        toast.success('Aufgabe aktualisiert');
      } else {
        await api.createTask(taskData);
        toast.success('Aufgabe erstellt');
      }
      setIsDialogOpen(false);
      loadTasks();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await api.importTasksCSV(file);
      toast.success(`${response.data.imported} Aufgaben importiert`);
      if (response.data.errors?.length > 0) {
        toast.error(`${response.data.errors.length} Fehler beim Import`);
      }
      loadTasks();
    } catch (error) {
      toast.error('Fehler beim CSV-Import');
    }
    e.target.value = '';
  };

  const filteredTasks = tasks.filter(task => 
    task.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white p-6 hidden lg:block">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg">M</span>
          </div>
          <span className="font-bold text-xl" style={{ fontFamily: 'Manrope' }}>MatheVilla</span>
        </div>

        <nav className="space-y-2">
          <Link to="/admin" className="sidebar-link">
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/admin/tasks" className="sidebar-link active">
            <ClipboardList className="w-5 h-5" />
            Aufgaben verwalten
          </Link>
          <Link to="/admin/students" className="sidebar-link">
            <UserCircle className="w-5 h-5" />
            Schülerübersicht
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Button 
            variant="ghost" 
            onClick={() => { logout(); window.location.href = '/'; }} 
            className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Abmelden
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4">
        <div className="flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">Aufgaben</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }} data-testid="tasks-heading">
              Aufgaben verwalten
            </h1>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  data-testid="csv-upload"
                />
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    CSV Import
                  </span>
                </Button>
              </label>
              <Button onClick={handleCreate} className="bg-emerald-500 hover:bg-emerald-600" data-testid="create-task-btn">
                <Plus className="w-4 h-4 mr-2" />
                Neue Aufgabe
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-md mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="search-input"
                    />
                  </div>
                </div>
                <Select value={filterGrade} onValueChange={(v) => { setFilterGrade(v); setFilterTopic(''); }}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="filter-grade">
                    <SelectValue placeholder="Alle Klassen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Klassen</SelectItem>
                    {[5, 6, 7, 8, 9, 10].map(g => (
                      <SelectItem key={g} value={g.toString()}>Klasse {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filterGrade && filterGrade !== 'all' && (
                  <Select value={filterTopic} onValueChange={setFilterTopic}>
                    <SelectTrigger className="w-full sm:w-48" data-testid="filter-topic">
                      <SelectValue placeholder="Alle Themen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Themen</SelectItem>
                      {topics.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table */}
          <Card className="border-0 shadow-md" data-testid="tasks-table">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Klasse</TableHead>
                      <TableHead>Thema</TableHead>
                      <TableHead className="min-w-[300px]">Frage</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Schwierigkeit</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.grade}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{task.topic}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{task.question}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.task_type === 'multiple_choice' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {task.task_type === 'multiple_choice' ? 'MC' : 'Text'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            task.difficulty === 'leicht' ? 'difficulty-leicht' :
                            task.difficulty === 'schwer' ? 'difficulty-schwer' : 'difficulty-mittel'
                          }`}>
                            {task.difficulty}
                          </span>
                        </TableCell>
                        <TableCell>{task.xp_reward}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(task)} data-testid={`edit-${task.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(task)} className="text-red-500 hover:text-red-600" data-testid={`delete-${task.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredTasks.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  Keine Aufgaben gefunden
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-sm text-slate-500 mt-4">
            {filteredTasks.length} Aufgaben angezeigt
          </p>
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope' }}>
              {selectedTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe erstellen'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Klasse</Label>
                <Select 
                  value={formData.grade} 
                  onValueChange={(v) => { 
                    setFormData({...formData, grade: v, topic: ''}); 
                    loadTopics(v); 
                  }}
                >
                  <SelectTrigger data-testid="form-grade">
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 6, 7, 8, 9, 10].map(g => (
                      <SelectItem key={g} value={g.toString()}>Klasse {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Thema</Label>
                <Select value={formData.topic} onValueChange={(v) => setFormData({...formData, topic: v})}>
                  <SelectTrigger data-testid="form-topic">
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Frage</Label>
              <Textarea
                value={formData.question}
                onChange={(e) => setFormData({...formData, question: e.target.value})}
                placeholder="Die Aufgabenstellung..."
                rows={3}
                data-testid="form-question"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Aufgabentyp</Label>
                <Select value={formData.task_type} onValueChange={(v) => setFormData({...formData, task_type: v})}>
                  <SelectTrigger data-testid="form-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free_text">Freitext</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Schwierigkeit</Label>
                <Select value={formData.difficulty} onValueChange={(v) => setFormData({...formData, difficulty: v})}>
                  <SelectTrigger data-testid="form-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leicht">Leicht</SelectItem>
                    <SelectItem value="mittel">Mittel</SelectItem>
                    <SelectItem value="schwer">Schwer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.task_type === 'multiple_choice' && (
              <div>
                <Label>Antwortoptionen (getrennt durch |)</Label>
                <Input
                  value={formData.options}
                  onChange={(e) => setFormData({...formData, options: e.target.value})}
                  placeholder="Option 1|Option 2|Option 3|Option 4"
                  data-testid="form-options"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Richtige Antwort</Label>
                <Input
                  value={formData.correct_answer}
                  onChange={(e) => setFormData({...formData, correct_answer: e.target.value})}
                  placeholder="Die korrekte Antwort"
                  data-testid="form-answer"
                />
              </div>
              <div>
                <Label>XP-Belohnung</Label>
                <Input
                  type="number"
                  value={formData.xp_reward}
                  onChange={(e) => setFormData({...formData, xp_reward: parseInt(e.target.value)})}
                  min={5}
                  max={100}
                  data-testid="form-xp"
                />
              </div>
            </div>

            <div>
              <Label>Erklärung</Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                placeholder="Erklärung zur Lösung..."
                rows={3}
                data-testid="form-explanation"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600" data-testid="form-submit">
                {selectedTask ? 'Speichern' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aufgabe löschen?</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">Diese Aktion kann nicht rückgängig gemacht werden.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600" data-testid="confirm-delete">
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
