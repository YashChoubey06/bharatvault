import axios from "axios";
const apiClient=axios.create({baseURL:"/api/v1",withCredentials:true});
apiClient.interceptors.response.use(response=>response,error=>{
 const detail=error.response?.data?.detail;
 error.message=typeof detail==="string"?detail:Array.isArray(detail)?detail.map(d=>d.msg).join("; "):"Cannot reach the local backend. Start both servers and try again.";
 return Promise.reject(error);
});
export default apiClient;
