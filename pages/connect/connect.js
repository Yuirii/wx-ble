// pages/connect/connect.js
import { formatTime, ab2hex, hexCharCodeToStr, hexTObuffer, writeVal } from '../../utils/util.js'
const app = getApp()
const bluetooth = app.blueTooth

// const params = {
//   serviceId: '0000FFF0',
//   characteristicId: '0000FFF4'
// }
const params = {
  serviceId: '0000FFF0-0000-1000-8000-00805F9B34FB',
  characteristicId: '0000FFF1-0000-1000-8000-00805F9B34FB'
}

// -0000-1000-8000-00805F9B34FB
// 

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isConnectting: false,
    servicesList: [],
    characteristicsList: [],
    characteristicId: '',
    serviceId: '',
    device: [],
    inputValue: '',
    idx: '',
    uuid: '',
    info: {},
    isHEX: false,
    result_str: [],
    result_hex: []
  },

  /** 
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    console.log('connect page onload')
    this.setData({
      device: options,
      info: options
    })
  },

  op_encrypt: function () {
    // wx.request({
    //   url: '',
    //   data: {},
    //   success (res) {
    //     console.log(res)
    //   },
    //   fail (err) {
    //     console.log(res)
    //   },
    //   complete (res) {
    //     conso.log(res)
    //   }
    // })
  },

  connect: function () {
    let _this = this
    const deviceId = wx.getStorageSync('deviceId')
    bluetooth('createBLEConnection', {
      data: {
        deviceId: deviceId + ''
      },
      success(res) {
        console.log('------------createBLEConnection------------------------')
        console.log(res)
        _this.setData({
          isConnectting: true
        })

        setTimeout(() => {
          bluetooth('getConnectedBluetoothDevices', {

          }) 
        }, 2000)
        // 监听蓝牙连接的错误事件
        wx.onBLEConnectionStateChange(e => {
          if (!e.connected) {  // 连接断开
            wx.showToast({
              title: `连接断开`,
            })
            _this.setData({
              isConnectting: false
            })
          }
        })
        bluetooth('onBluetoothAdapterStateChange', function (res) {
          console.log('bluetooth adapter state changed')
          console.log(res)
        })
      }
    })
  },

  cutConnect: function () {
    let _this = this
    const deviceId = wx.getStorageSync('deviceId')
    bluetooth('closeBLEConnection', {
      data: {
        deviceId
      },
      success: function () {
        console.log('cutConnect success')
        _this.setData({
          isConnectting: false
        })
      }
    })
  },


  allServices: function () {
    let _this = this
    const deviceId = wx.getStorageSync('deviceId')
    bluetooth('getBLEDeviceServices', {
      data: {
        deviceId: deviceId
      },
      success(res) {
        console.log('------------getBLEDeviceServices------------------------')
        console.log(res)
        _this.setData({
          servicesList: res.services
        })
      }
    })
  },

  chooseServiceId: function (e) {
    let _this = this
    console.log(e)
    let uuid = e.currentTarget.dataset.uuid
    let index = e.currentTarget.dataset.index
    _this.data.info.serviceId = uuid
    _this.setData({
      uuid: uuid,
      idx: index,
      info: _this.data.info
    })
    wx.setStorage({
      key: 'serviceId',
      data: uuid,
    })
  },

  current_allCharacter: function () {
    let _this = this
    let info = _this.data.info
    console.log('info')
    console.log(info)
    let serviceId = info.serviceId
    let deviceId = info.deviceId
    // wx.getBLEDeviceCharacteristics({
    //   deviceId: info.deviceId,
    //   serviceId,
    //   success: function(res) {
    //     console.log(res)
    //     _this.setData({
    //       characteristicsList: res.characteristics
    //     })
    //   },
    // })
    bluetooth('getBLEDeviceCharacteristics', {
      data: {
        deviceId,
        serviceId
      },
      success: function (res) {
        console.log(res)
        _this.setData({
          characteristicsList: res.characteristics
        })
      },
      fail: function (err) {
        console.log(err)
      }
    })
  },

  character: function (serviceId, cb) {
    let _this = this
    let info = _this.data.info
    delete info.name
    // wx.getBLEDeviceCharacteristics({
    //   deviceId: info.deviceId,
    //   serviceId,
    //   success: function(res) {
    //     console.log(res.characteristics)
    //     _this.setData({
    //       characteristicsList: res.characteristics
    //     })
    //     cb()
    //   },
    // })
    bluetooth('getBLEDeviceCharacteristics', {
      deviceId: info.deviceId,
      serviceId,
      success: function (res) {
        console.log(res.characteristics)
        _this.setData({
          characteristicsList: res.characteristics
        })
        cb()
      },
      fail: function (err) {
        console.log(err)
      }
    })
  },

  chooseCharacter: function (e) {
    console.log(e)
    const characteristicId = e.currentTarget.dataset.uuid
    this.data.info.characteristicId = characteristicId
    this.setData({
      info: this.data.info
    })
    wx.showLoading({
      title:characteristicId,
    })

    setTimeout(function () {
      wx.hideLoading()
    }, 1200)
    console.log(this.data.info)
  },

  read: function (e) {
    let _this = this
    let info = _this.data.info
    delete info.name
    bluetooth('notifyBLECharacteristicValueChange', {
      data: {
        ...info,
        state: true
      },
      success: function (res) {
        console.log('---------- notify success ------------')
        // 必须在这里的回调才能获取
        bluetooth('onBLECharacteristicValueChange', function (characteristic) {
          console.log('changed --------')
          console.log(_this.hexCharCodeToStr(_this.ab2hex(characteristic.value)))
          console.log(_this.ab2hex(characteristic.value))
          console.log('changed --------')
        })
      },
      fail: function () {
        console.log('notify fail')
      }
    })
  },

  // 读写在ios上需要事先调用getBLEDeviceServices 和 getBLEDeviceCharacteristics

  write: function (e) {
    console.log('write value: ', this.data.inputValue)
    let _this = this
    let info = _this.data.info
    delete info.name
    // wx.writeBLECharacteristicValue({
    // let str = 'F05876362F314663794B4944433573305268435578554F4E533359495265514F476D642F45626B7961396F362B4E5A445A3053763762434258423757487A4D676A55534F4655486A714F4F677854617771525577364B49513D3DF1'
    let str = _this.data.inputValue

    // let str = 'F058763D3DF1'
    // const str = 'F05862794C584A'
    let arr = []
    for (let i = 0; i < Math.ceil(str.length / 40); i++) {
      arr.push(str.slice(i * 40, 40 * (i + 1)))
    }
    // 一次写入数据完成后在写入下一条，防止出错
    function writeVal(arr, info) {
      if (arr.length <= 0) {
        return
      }
      bluetooth('writeBLECharacteristicValue', {
        data: {
          ...info,
          value: hexTObuffer(arr[0])
        },
        success: function () {
          console.log('success')
          console.log(arr[0])
          arr.shift()
          writeVal(arr, info)
        },
        fail: function () {
          console.log('fail')
          return
        },
        complete: function () {

        }
      })
    }

    writeVal(arr, info)
  },

  // writeBLECharacteristicValue() {
  //   // 向蓝牙设备发送一个0x00的16进制数据
  //   let a = this.data.inputValue
  //   let buffer = new ArrayBuffer(a)
  //   let dataView = new DataView(buffer)
  //   dataView.setUint8(0, Math.random() * 255 | 0)
  //   // dataView.setUint8(0, 0)
  //   wx.writeBLECharacteristicValue({
  //     // deviceId,
  //     serviceId,
  //     characteristicId,
  //     value: buffer,
  //   })
  // },

  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  },

  notify() {
    let _this = this
    let info = this.data.info
    let result_str = []
    let result_hex = []
    // 开启notify功能
    bluetooth('notifyBLECharacteristicValueChange', {
      data: {
        ...info,
        state: true
      },
      success() {
        // 监听特征值变化
        bluetooth('onBLECharacteristicValueChange', (res) => {
          console.log('BLECharacteristicValue had changed----')
          console.log(new Date().getTime())
          console.log(hexCharCodeToStr(ab2hex(res.value)))
          result_str.push(hexCharCodeToStr(ab2hex(res.value)))
          result_hex.push(ab2hex(res.value))
          _this.setData({
            result_str,
            result_hex
          })
        })
      }
    })
  },

  // ArraryBuffer 转 16
  ab2hex: function (buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  },
  // 16进制转字符串
  hexCharCodeToStr(hexCharCodeStr) {
    var trimedStr = hexCharCodeStr.trim();
    var rawStr =
      trimedStr.substr(0, 2).toLowerCase() === "0x"
        ?
        trimedStr.substr(2)
        :
        trimedStr;
    var len = rawStr.length;
    if (len % 2 !== 0) {
      console.log("Illegal Format ASCII Code!");
      return "";
    }
    var curCharCode;
    var resultStr = [];
    for (var i = 0; i < len; i = i + 2) {
      curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
      resultStr.push(String.fromCharCode(curCharCode));
    }
    return resultStr.join("");
  },

  setInput (e) {
    console.log(e)
    this.setData({
      inputValue: e.detail.value
    })
  },

  jump: function () {
    let _this = this
    _this.read()
    _this.write()
    wx.redirectTo({
      url: '/pages/test/test'
    })
  },

  change_hex() {
    let _this = this
    _this.setData({
      isHEX: !_this.data.isHEX
    })
  }


})