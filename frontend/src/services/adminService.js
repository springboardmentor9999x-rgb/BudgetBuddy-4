import api from "../api/axios";

export const getAdminOverview=async()=>(await api.get("/admin/overview")).data;
export const getAdminUsers=async()=>(await api.get("/admin/users")).data;
export const updateUserAccess=async(id,update)=>(await api.patch(`/admin/users/${id}`,update)).data;
export const getMembership=async()=>(await api.get("/membership/me")).data;
export const getPremiumPlans=async()=>(await api.get("/membership/plans")).data;
export const createPaymentOrder=async()=>(await api.post("/membership/orders")).data;
export const activatePremium=async()=>(await api.post("/membership/upgrade")).data;
export const verifyPayment=async(payment)=>(await api.post("/membership/verify",payment)).data;
export const activateDemoPremium=async()=>(await api.post("/membership/demo-upgrade")).data;
export const cancelMembership=async()=>(await api.delete("/membership/me")).data;
export const getPayments=async()=>(await api.get("/admin/payments")).data;
