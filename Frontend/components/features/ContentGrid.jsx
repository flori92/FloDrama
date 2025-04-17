import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/ContentGrid.css';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useNotifications } from '../ui/notification';

const skeletonArray = Array.from({ length: 10 });

const ContentGrid = ({ items = [], loading = false }) => {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { addNotification } = useNotifications();
  const [animatingId, setAnimatingId] = React.useState(null);

  if (loading) {
    return (
      <div className="contentgrid">
        {skeletonArray.map((_, idx) => (
          <motion.div
            key={idx}
            className="contentgrid-card skeleton"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05, duration: 0.4 }}
          >
            <div className="contentgrid-poster skeleton-poster" />
            <div className="contentgrid-info">
              <div className="skeleton-title" />
              <div className="skeleton-meta" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }
  if (!items || items.length === 0) {
    return <div className="contentgrid-empty">Aucun contenu à afficher.</div>;
  }
  const handleWatchlistClick = (item) => {
    const added = toggleWatchlist(item);
    setAnimatingId(item.id);
    setTimeout(() => setAnimatingId(null), 600);
    addNotification({
      title: added ? 'Ajouté à Ma Liste' : 'Retiré de Ma Liste',
      message: `${item.title} ${added ? 'a été ajouté à' : 'a été retiré de'} votre liste de visionnage.`,
      type: added ? 'success' : 'info',
      duration: 3500
    });
  };
  return (
    <motion.div className="contentgrid" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}>
      {items.map((item, idx) => {
        const inWatchlist = isInWatchlist(item.id);
        return (
          <motion.div
            className="contentgrid-card"
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.35 }}
          >
            <div className="contentgrid-poster-container">
              <img src={item.posterUrl} alt={item.title} className="contentgrid-poster" loading="lazy" />
              {item.isNew && <span className="badge-new">Nouveau</span>}
              {item.isTrending && <span className="badge-trend">Tendance</span>}
            </div>
            <div className="contentgrid-info">
              <h3 className="contentgrid-title">{item.title}</h3>
              <p className="contentgrid-meta">
                {item.year && <span className="contentgrid-year">{item.year}</span>}
                {item.rating && <span className="contentgrid-rating">★ {item.rating.toFixed(1)}</span>}
                {item.genres && <span className="contentgrid-genres">{item.genres.join(', ')}</span>}
              </p>
              <motion.button
                className={`contentgrid-watchlist-btn${inWatchlist ? ' added' : ''}${animatingId === item.id ? ' animating' : ''}`}
                aria-label={inWatchlist ? 'Retirer de la liste' : 'Ajouter à la liste'}
                onClick={() => handleWatchlistClick(item)}
                whileTap={{ scale: 0.92 }}
                animate={animatingId === item.id ? { scale: [1, 1.15, 1], background: inWatchlist ? 'linear-gradient(90deg,#d946ef,#3b82f6)' : undefined } : {}}
                transition={{ duration: 0.45 }}
              >
                {inWatchlist ? <span style={{color:'#3b82f6'}}>✔ Ma liste</span> : '+ Ma liste'}
              </motion.button>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default ContentGrid;
