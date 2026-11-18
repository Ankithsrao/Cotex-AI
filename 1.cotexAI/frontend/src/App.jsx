import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Home from "./pages/Home";
import { auth } from "../utils/firebase";
import getCurrentUser from "./features/getCurrentUser";
import { useDispatch } from "react-redux";
import { setUserData } from "./redux/userSlice";

const App = () => {

  const dispatch = useDispatch()

  useEffect(()=>{
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        const data = await getCurrentUser()
        dispatch(setUserData(data ? {
          ...data,
          avatar: data.avatar || firebaseUser?.photoURL || null
        } : null))
      })
      return unsubscribe
    },[dispatch])
  
  return (
   <>
   <Home />
   </>
  );
};

export default App;
