export const event = {
  name: "clientReady",
  once: true,
  execute(client) {
    console.log(`Bot ready: ${client.user.tag}`)
  }
}