import { createClient } from 'redis';

console.clear()
console.log('-------------- Mog NodeJS Microservice DEMO --------------')
console.log('------------------ Server is Running ---------------------')

const client = createClient()
const subscriber = client.duplicate();
await subscriber.connect();
const publisher = client.duplicate();
await publisher.connect();

/**
 * isEmitter 判断是否为 event-based 模式
 * 
 * 通过 JSON.stringify 判断是否为 event-based 模式。
 * 原理：在 event-based 模式下, pattern 是不带 cmd 的。
 * 
 * @param {string} pattern 模式
 * @returns boolean
 */
function isEmitter(pattern) {
  try {
    JSON.stringify(pattern)
    return false
  } catch {
    return true
  }
}

/**
 * 解析来自 NestJS Gateway 发布的信息
 * @param {string} message
 * @returns object
 */
function parseEventDataFromGateway(message) {
  message = JSON.parse(message)
  return {
    id: message.id,
    data: message.data,
    pattern: JSON.stringify(message.pattern),
    isEmitter: isEmitter(message.pattern),
  }
}

/**
 * 快捷生成模式
 * @param {string} pattern 活动名称
 * @param {boolean} isEmit 是否为 event-based 模式
 * @returns string
 */
function generagtePattern(pattern, isEmit) {
  if (!isEmit) {
    return JSON.stringify({ cmd: pattern })
  }
  return pattern
}

/**
 * 生成响应数据
 * @param {string} id 事件ID
 * @param {string | object} data 事件数据
 * @returns string
 */
function generagteResponse(id, data) {
  return JSON.stringify(
    {
      response: data,
      isDisposed: true,
      id,
    }
  )
}

const pattern = generagtePattern("user.get.master", false)

await subscriber.subscribe(pattern, async (message) => {
  const { id, data, pattern, isEmitter } = parseEventDataFromGateway(message)
  console.log("Message: ", message)
  console.log("Event ID: ", id)
  console.log("Data: ", data)
  console.log("Pattern: ", pattern)
  console.log("isEmitter: ", isEmitter)
  await publisher.publish(`${pattern}.reply`, generagteResponse(id, { name: 'test' }))
});