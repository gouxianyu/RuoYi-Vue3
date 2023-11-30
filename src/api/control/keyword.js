import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi";

// 查询关键字列表
export function listKeyword(query) {
  return request({
    url: '/control/keyword/list',
    method: 'get',
    params: query
  })
}

// 查询关键字详细
export function getKeyword(keywordId) {
  return request({
    url: '/control/keyword/' + parseStrEmpty(keywordId),
    method: 'get'
  })
}

// 新增关键字
export function addKeyword(data) {
  return request({
    url: '/control/keyword',
    method: 'post',
    data: data
  })
}

// 修改关键字
export function updateKeyword(data) {
  return request({
    url: '/control/keyword',
    method: 'put',
    data: data
  })
}

// 删除关键字
export function delKeyword(keywordId) {
  return request({
    url: '/control/keyword/' + keywordId,
    method: 'delete'
  })
}
