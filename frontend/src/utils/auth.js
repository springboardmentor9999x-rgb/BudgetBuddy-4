export const saveUser = (data) => {



    localStorage.setItem(



        "token",



        data.access_token



    );



    localStorage.setItem(



        "user",



        JSON.stringify(data.user)



    );



};



export const getUser = () => {



    return JSON.parse(



        localStorage.getItem("user")



    );



};



export const getToken = () => {



    return localStorage.getItem("token");



};



export const logout = () => {



    localStorage.removeItem("token");



    localStorage.removeItem("user");



};