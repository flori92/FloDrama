import { useEffect, useContext, lazy, Suspense } from "react";
import "./App.css";

const Home = lazy(() => import("./Pages/Home"));
const Series = lazy(() => import("./Pages/Series"));
const Search = lazy(() => import("./Pages/Search"));
const Profile = lazy(() => import("./Pages/Profile"));
const MyList = lazy(() => import("./Pages/MyList"));
const SignIn = lazy(() => import("./Pages/SignIn"));
const SignUp = lazy(() => import("./Pages/SignUp"));
const Welcome = lazy(() => import("./Pages/Welcome"));
const ErrorPage = lazy(() => import("./Pages/ErrorPage"));
const Play = lazy(() => import("./Pages/Play"));
const LikedMovies = lazy(() => import("./Pages/LikedMovies"));
const History = lazy(() => import("./Pages/History"));
const MoviesCategory = lazy(() => import("./Pages/MoviesCategory"));

// Import des pages du footer
const FAQ = lazy(() => import("./Pages/FooterPages/FAQ"));
const APropos = lazy(() => import("./Pages/FooterPages/APropos"));
const Confidentialite = lazy(() => import("./Pages/FooterPages/Confidentialite"));
const TestConnexion = lazy(() => import("./Pages/FooterPages/TestConnexion"));
const MentionsLegales = lazy(() => import("./Pages/FooterPages/MentionsLegales"));
const CommentRegarder = lazy(() => import("./Pages/FooterPages/CommentRegarder"));

import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./Context/UserContext";
import { getAuth, onAuthStateChanged } from "./Cloudflare/CloudflareAuth";
import Loading from "./componets/Loading/Loading";
import Navbar from "./componets/Header/Navbar";
import NavbarWithoutUser from "./componets/Header/NavbarWithoutUser";

function App() {
  const { User, setUser } = useContext(AuthContext);
  useEffect(() => {
    // Utiliser onAuthStateChanged directement avec le callback
    // Compatible avec l'implémentation Cloudflare
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      console.log(user);
    });
    
    // Nettoyer l'abonnement lors du démontage du composant
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [setUser]);

  return (
    <div>
      {User ? <Navbar></Navbar> : <NavbarWithoutUser></NavbarWithoutUser>}
      <Suspense replace fallback={<Loading />}>
        <Routes>
          <Route index path="/" element={User ? <Home /> : <Welcome />} />
          {User ? (
            <>
              <Route path="/home" element={<Home />} />
              <Route path="/series" element={<Series />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/mylist" element={<MyList />} />
              <Route path="/liked" element={<LikedMovies />} />
              <Route path="/history" element={<History />} />
              <Route path="/category/:category" element={<MoviesCategory />} />
              <Route path="/play/:id" element={<Play />} />
            </>
          ) : null}
          <Route path="/play/:id" element={<Play />} />

          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Routes pour les pages du footer - accessibles à tous */}
          <Route path="/footer/faq" element={<FAQ />} />
          <Route path="/footer/a-propos" element={<APropos />} />
          <Route path="/footer/confidentialite" element={<Confidentialite />} />
          <Route path="/footer/test-connexion" element={<TestConnexion />} />
          <Route path="/footer/mentions-legales" element={<MentionsLegales />} />
          <Route path="/footer/comment-regarder" element={<CommentRegarder />} />
          <Route path="/footer/centre-aide" element={<FAQ />} /> {/* Redirection temporaire vers la FAQ */}
          <Route path="/footer/preferences-cookies" element={<Confidentialite />} /> {/* Redirection temporaire vers Confidentialité */}
          <Route path="/footer/informations-legales" element={<MentionsLegales />} /> {/* Redirection temporaire vers Mentions légales */}
          <Route path="/footer/ios" element={<CommentRegarder />} /> {/* Redirection temporaire vers Comment regarder */}
          <Route path="/footer/android" element={<CommentRegarder />} /> {/* Redirection temporaire vers Comment regarder */}
          
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
