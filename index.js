
import { TimespyTestResultService, getAverage } from './service.js'

function getPercentage(value, basis) {
    return `${Math.round(value / basis * 1000) / 10}%`
}
async function handleDataInFolder(targetFolder) {
    const validResults = await TimespyTestResultService.extract3DMarkResults(targetFolder)
    console.log(`Total valid files: ${validResults.length} in ${targetFolder}`)
    for (let result of validResults) {
        result.gpuFreq = TimespyTestResultService.getAverageGPUFrequency(result.data)
        result.gpuTemp = TimespyTestResultService.getAverageGPUTemperature(result.data)
        result.vramClock = TimespyTestResultService.getAverageVRAMClock(result.data)
        result.folderName = targetFolder.split('/').at(-1)
        // console.log(`${result.file} score: `, result.score)
        // console.log('Average GPU Frequency: ', result.gpuFreq)
        // console.log('Average GPU Temperature: ', result.gpuTemp)
        // console.log('Average GPU VRAM Clock: ', result.vramClock)
    }
    return validResults
}
const folders = ['./data/powercolor', './data/gigabyte', './data/powercolor_fan_raging', './data/powercolor_undervolt']
let basisScore = 0
let basisGPUFrequency = 0
let basisvramClock = 0
for (let folder of folders) {
    const folderResults = await handleDataInFolder(folder)
    const averageScore = Math.round(getAverage(folderResults.map(i => i.score)))
    const averageGPUFrequency = Math.round(getAverage(folderResults.map(i => i.gpuFreq)))
    const averageVRAMClock = Math.round(getAverage(folderResults.map(i => i.vramClock)))
    if (basisScore === 0) {
        basisScore = averageScore
    }
    if (basisGPUFrequency === 0) {
        basisGPUFrequency = averageGPUFrequency
    }
    if (basisvramClock === 0) {
        basisvramClock = averageVRAMClock
    }
    console.log(`Average Timespy Score in ${folderResults[0].folderName}: ${averageScore} (${getPercentage(averageScore, basisScore)})`)
    console.log(`Average GPU Frequency in ${folderResults[0].folderName}: ${averageGPUFrequency} (${getPercentage(averageGPUFrequency, basisGPUFrequency)})`)
    console.log(`Average VRAM Clock in ${folderResults[0].folderName}: ${averageVRAMClock} (${getPercentage(averageVRAMClock, basisvramClock)})`)

}