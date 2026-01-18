import { createContext, useState, useEffect } from "react";
import { auth } from "./config";
import { onAuthStateChanged } from "firebase/auth";

const AuthStateContext = createContext()

function AuthStateContextProvider({children}){

    const [email, setEmail] = useState(null)
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            setEmail(user.email)
        })
    }, [])
    return(
        <AuthStateContext.Provider value={{email}}>
            {children}
        </AuthStateContext.Provider>
    )
}

export {AuthStateContext, AuthStateContextProvider}