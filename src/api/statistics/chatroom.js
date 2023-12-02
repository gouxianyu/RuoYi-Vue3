import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi";

// 查询群组列表
export function listChatroom(query) {
    return request({
        url: '/statistics/chatroom/list',
        method: 'get',
        params: query
    })
}


// 查询群组详细
export function getChatroom(query) {
    return request({
        url: '/statistics/chatroom/getInfo',
        method: 'get',
        params: query
    })
}

// 修改群组
export function updateChatroom(data) {
    return request({
        url: '/statistics/chatroom',
        method: 'put',
        data: data
    })
}


// 机器人绑定抓取监视群列表
export function listRobotMonitor(query) {
    return request({
        url: '/statistics/chatroom/monitor',
        method: 'get',
        params: query
    })
}

//查询机器人的群
export function listRobotRooms(query) {
    return request({
        url: '/statistics/chatroom/listRobotRooms',
        method: 'get',
        params: query
    })
}