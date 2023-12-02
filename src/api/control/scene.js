import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi";

// 查询场景列表
export function listScene(query) {
  return request({
    url: '/control/scene/list',
    method: 'get',
    params: query
  })
}

// 查询场景详细
export function getScene(sceneId) {
  return request({
    url: '/control/scene/' + parseStrEmpty(sceneId),
    method: 'get'
  })
}

// 新增场景
export function addScene(data) {
  return request({
    url: '/control/scene',
    method: 'post',
    data: data
  })
}

// 修改场景
export function updateScene(data) {
  return request({
    url: '/control/scene',
    method: 'put',
    data: data
  })
}

// 删除场景
export function delScene(sceneId) {
  return request({
    url: '/control/scene/' + sceneId,
    method: 'delete'
  })
}


// 场景绑定机器人
export function bindRobot(data) {
  return request({
    url: '/control/scene/bindRobot',
    method: 'put',
    data: data
  })
}

// 查询场景绑定的机器人详细
export function getRobotsBySceneId(sceneId) {
  return request({
    url: '/control/scene/getBindRobot/' + parseStrEmpty(sceneId),
    method: 'get'
  })
}