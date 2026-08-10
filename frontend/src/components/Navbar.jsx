import { Link } from 'react-router-dom';
import { ShieldPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2 text-primary font-bold text-2xl">
        <ShieldPlus size={32} />
        <span className="font-poppins">MediShield AI</span>
      </div>
      <div className="hidden md:flex gap-8 font-medium">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <a href="#features" className="hover:text-primary transition-colors">Features</a>
        <a href="#security" className="hover:text-primary transition-colors">Security</a>
      </div>
      <div>
        <Link to="/login">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-white px-6 py-2 rounded-full font-medium shadow-lg hover:shadow-primary/30 transition-shadow"
          >
            Login / Register
          </motion.button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
