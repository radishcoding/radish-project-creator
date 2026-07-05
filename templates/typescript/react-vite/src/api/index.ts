import { apiClient, bareClient } from "@/api/client"
import { attachInterceptors } from "@/api/interceptors"

attachInterceptors(apiClient)

export { apiClient, bareClient }
export * from "@/api/types"
