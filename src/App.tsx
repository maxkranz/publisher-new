import React, { useState, useEffect } from 'react';
import { PlusCircle, X, ExternalLink, Search, Menu, Star, StarHalf, LogIn, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { signOut } from './lib/auth';
import type { User } from '@supabase/supabase-js';
import Login from './pages/Login';

interface Project {
  id: string;
  title: string;
  link: string;
  image: string;
  rating: number;
  category?: string;
  created_at: string;
}

const recentUpdates = [
  { date: '01/02/2025', text: 'Consilium game added' },
  { date: '12/29/2024', text: 'Password Generator added' },
  { date: '12/28/2024', text: 'Aries App added' }
];

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showLoginPage, setShowLoginPage] = useState(false);

  // Project form state
  const [projectName, setProjectName] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [projectImage, setProjectImage] = useState('');

  useEffect(() => {
    // Check for initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel('projects_channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'projects' },
        (payload) => {
          setProjects(current => [...current, payload.new as Project]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      setError('Failed to fetch projects');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a project');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const newProject = {
        title: projectName,
        link: projectLink,
        image: projectImage || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=300&h=200',
        rating: 0,
        user_id: user.id
      };

      const { error } = await supabase
        .from('projects')
        .insert([newProject]);

      if (error) throw error;

      setProjectName('');
      setProjectLink('');
      setProjectImage('');
      setIsModalOpen(false);
    } catch (err) {
      setError('Failed to create project');
      console.error('Error:', err);
    }
  };

  const handleAuthSuccess = () => {
    setShowLoginPage(false);
    setIsAuthModalOpen(false);
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 inline" />);
      } else if (i - 0.5 === rating) {
        stars.push(<StarHalf key={i} className="w-4 h-4 text-yellow-400 inline" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300 inline" />);
      }
    }
    return stars;
  };

  if (showLoginPage) {
    return <Login onSuccess={handleAuthSuccess} onBack={() => setShowLoginPage(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-400">MK Publisher</h1>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <PlusCircle size={20} />
                    Create Project
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-gray-300 hover:text-white"
                  >
                    <LogOut size={20} />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginPage(true)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white"
                >
                  <LogIn size={20} />
                  Sign In
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Discover Amazing Projects
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Explore a curated collection of apps and games, or share your own creations with the world.
          </p>
          <button className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            Get Started
          </button>
        </div>
      </section>

      {/* Projects Grid */}
      <main className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading projects...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <a
                key={project.id}
                href={project.link}
                className="group bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-200"
              >
                <div className="relative h-48">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                  {project.category === 'featured' && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                      Featured
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{project.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {renderStars(project.rating)}
                    </div>
                    <ExternalLink className="text-gray-400 group-hover:text-blue-400 w-5 h-5" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Recent Updates */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Updates</h2>
          <div className="space-y-4">
            {recentUpdates.map((update, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">📅</span>
                </div>
                <div>
                  <p className="text-white font-medium">{update.text}</p>
                  <p className="text-gray-400 text-sm">{update.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Create New Project</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="projectLink" className="block text-sm font-medium text-gray-300 mb-1">
                    Project Link
                  </label>
                  <input
                    type="url"
                    id="projectLink"
                    value={projectLink}
                    onChange={(e) => setProjectLink(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="projectImage" className="block text-sm font-medium text-gray-300 mb-1">
                    Project Image URL
                  </label>
                  <input
                    type="url"
                    id="projectImage"
                    value={projectImage}
                    onChange={(e) => setProjectImage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors duration-200"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-40">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="space-y-6">
              <a href="#" className="block text-lg text-white hover:text-blue-400">About</a>
              <a href="#" className="block text-lg text-white hover:text-blue-400">Post Your Project</a>
              <a href="#" className="block text-lg text-white hover:text-blue-400">Pricing</a>
              <a href="#" className="block text-lg text-white hover:text-blue-400">Telegram</a>
            </nav>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p>© Max Kranz Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;