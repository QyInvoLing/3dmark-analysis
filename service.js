import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import admZip from 'adm-zip'
import { parseStringPromise } from 'xml2js'
export const getAverage = (array) =>
    array.reduce((sum, currentValue) => sum + currentValue, 0) / array.length
export class TimespyTestResultService {
    static getAverageGPUFrequency(data) {
        const validData = data['GPUZ/GpuCoreClock/0/0:'].filter(i => i > 2000)
        return Math.round(getAverage(validData))
    }
    static getAverageGPUTemperature(data) {
        const validData = data['GPUZ/GpuTemperature/0/2:'].filter(i => i > 40)
        return Math.round(getAverage(validData))
    }
    static getAverageVRAMClock(data) {
        const validData = data['GPUZ/GpuMemoryClock/0/1:'].filter(i => i > 2000)
        return Math.round(getAverage(validData))
    }
    /**
    * 读取文件夹下所有.3dmark-result文件，读取其分数并提取其中RawMonitoringData.json中的部分数据
    * @param {string} folderPath
    * @returns {Promise<Array<{file: string, data: object, score: string}>>}
    */
    static async extract3DMarkResults(folderPath) {
        if (!existsSync(folderPath)) {
            throw new Error(`This path doesn't exist: ${folderPath}`)
        }

        // 读取文件夹下所有文件
        const resultFiles = readdirSync(folderPath).filter(file => file.endsWith('.3dmark-result'))
        if (resultFiles.length === 0) {
            console.log(`No .3dmark-result in ${folderPath}`)
            return []
        }

        const results = []
        for (const file of resultFiles) {
            const filePath = join(folderPath, file)
            try {
                const zip = new admZip(filePath)
                const zipEntries = zip.getEntries()

                const monitoringDataEntry = zipEntries.find(entry =>
                    entry.entryName === 'RawMonitoringData.json'
                )
                const resultXMLEntry = zipEntries.find(entry =>
                    entry.entryName === 'Result.xml'
                )
                const parsedData = JSON.parse(zip.readAsText(monitoringDataEntry))
                // xml2js没提供同步方法
                const xmlObject = await parseStringPromise(zip.readAsText(resultXMLEntry))
                results.push({
                    file: file,
                    data: parsedData,
                    score: parseInt(xmlObject.benchmark.results[0].result[0].TimeSpyPerformanceGraphicsScore[0])
                })
           } catch (error) {
                console.error(`Error while handling ${file}: `, error)
            }
        }
        return results
    }
}