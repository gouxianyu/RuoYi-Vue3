import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi";

// 查询机器人列表
export function listRobot(query) {
  return request({
    url: '/control/robot/list',
    method: 'get',
    params: query
  })
}

// 下拉机器人列表
export function getSelectRobot(query) {
  return request({
    url: '/control/robot/optionselect',
    method: 'get',
    params: query
  })
}


