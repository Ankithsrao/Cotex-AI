import { signInWithPopup } from "firebase/auth";
import {auth, googleProvider} from "../../utils/firebase"
import api from "../../utils/axios"
import { FcGoogle } from "react-icons/fc";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice";
import Sidebar from "../../components/Sidebar";
import ChatArea from "../../components/ChatArea";
import Artifact from "../../components/Artifact";

const Home = () => {
 const {userData} = useSelector(state => state.user)
 const dispatch = useDispatch()
    const handleLogin = async (token, avatarUrl) => {
        try {
          const response = await api.post("/api/auth/login", { token });
          dispatch(setUserData({
            ...response.data,
            avatar: response.data.avatar || avatarUrl || null
          }))
        } catch (err) {
          console.error("Login failed:", err.response?.data || err.message);
        }
      };
    
      const googleLogin = async () => {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const token = await result.user.getIdToken();
    
          await handleLogin(token, result.user.photoURL);
        } catch (err) {
          console.error("Google sign-in failed:", err.message);
        }
      };
    
  return (
    <div className='h-screen min-w-0 flex bg-[#0d0f14] text-white overflow-hidden'>
      <Sidebar />
      <ChatArea />
      <Artifact />
      {!userData && <div className='fixed inset-0 z-50 flex items-center justify-center
        bg-black/60 backdrop-blur'>
            <div className='w-[340px] bg-[#13151c] border border-white/[0.88] rounded-2xl p-7 flex
            flex-col gap-5'>
                <div>
                    <h2 className='text-[17px] font-semibold text-slate-100 tracking-tight'>Welcome to CortexAI</h2>
                    <p className="text-[13px] text-slate-500">Please login to continue using the app.</p>
                </div>

                <button onClick={googleLogin} className="w-full flex items-center justify-center gap-3 py-[11px] rounded-xl
                text-sm font-medium text-black/90 bg-white hover:bg-gray-200 transition-all duration-150 cursor-pointer">
                    <FcGoogle size={15} />
                    Continue With Google
                </button>
            </div>
        </div> }
        
       

    </div>
  )
}

export default Home