import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS, RADIUS, GLASS } from '../../theme';

const PerfilModal = ({ isOpen, onClose }) => {
  const { usuario, actualizarPerfilUsuario } = useAuth();
  const [nombre, setNombre] = useState(usuario?.displayName || '');
  const [foto, setFoto] = useState(usuario?.photoURL || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await actualizarPerfilUsuario(nombre, foto);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={styles.overlay} onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          style={styles.content} onClick={e => e.stopPropagation()}
        >
          <div style={styles.header}>
            <h3>Editar Perfil</h3>
            <button onClick={onClose} style={styles.closeBtn}><X size={20}/></button>
          </div>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.avatarPreview}>
              <img src={foto || 'https://via.placeholder.com/150'} alt="Avatar" style={styles.avatarImg} />
            </div>
            
            <label style={styles.label}>Nombre</label>
            <input 
              style={styles.input} 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
            />

            <label style={styles.label}>URL de Foto</label>
            <input 
              style={styles.input} 
              value={foto} 
              onChange={e => setFoto(e.target.value)} 
              placeholder="https://..."
            />

            <button type="submit" style={styles.saveBtn} disabled={loading}>
              <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, ...GLASS.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 },
  content: { background: COLORS.surface, borderRadius: RADIUS.xl, padding: '30px', width: '400px', maxWidth: '90%', boxShadow: SHADOWS.float },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: COLORS.charcoalBlue, fontWeight: '800' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  avatarPreview: { width: '80px', height: '80px', borderRadius: RADIUS.full, overflow: 'hidden', alignSelf: 'center', marginBottom: '10px', border: `2px solid ${COLORS.atomicTangerine}` },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  label: { fontSize: '0.8rem', fontWeight: '700', color: COLORS.charcoalBlue, textTransform: 'uppercase' },
  input: { padding: '12px', borderRadius: RADIUS.sm, border: `1px solid ${COLORS.border}`, fontSize: '1rem' },
  saveBtn: { background: COLORS.atomicTangerine, color: 'white', padding: '14px', borderRadius: RADIUS.md, border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }
};

export default PerfilModal;