import proxy from "express-http-proxy"

export const proxyWithHeader=(serviceUrl, options = {})=>{
    return proxy(serviceUrl,{
        ...options,
        proxyReqOptDecorator:(proxyReqOpts,srcReq)=>{
            if(srcReq.user?.userId){
                proxyReqOpts.headers = {
                    ...proxyReqOpts.headers,
                    "x-user-id": String(srcReq.user.userId)
                }
            }
            return proxyReqOpts
        }
    })
}