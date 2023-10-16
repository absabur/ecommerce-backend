const{ DateTime } = require('luxon');

exports.localTime = (expire) => {
    let date = DateTime.now().setZone('UTC+6')
    let ampm = ""
    if (date.c.hour >=12 && date.c.hour <=23) {
      ampm = "PM"
    }else {
      ampm = "AM"
    }
    if (date.c.hour > 12) {
      date.c.hour = date.c.hour - 12
    }
    if (date.c.hour === 0) {
      date.c.hour = 12
    }
    let expireSec = (date.c.hour)*3600 + date.c.minute*60 + expire*60
    let expireHour = parseInt(expireSec/3600)
    if (expireHour === 13) {
      expireHour = 1
    }
    let expireMinute = parseInt((expireSec%3600)/60)

    if (expireHour < 10) {
        expireHour = "0"+expireHour
    }
    if (expireMinute < 10) {
        expireMinute = "0"+expireMinute
    }
    let Eampm;
    if (ampm === "AM" && expireHour < 12) {
      Eampm = "AM"
    }
    if (ampm === "PM" && expireHour < 12) {
      Eampm = "PM"
    }
    if (ampm === "AM" && expireHour === 12) {
      Eampm = "PM"
    }
    if (ampm === "PM" && expireHour === 12) {
      Eampm = "AM"
    }
    let expireTime = expireHour+":"+expireMinute+" "+Eampm

    // let sort = date.c.year*8760 + date.c.month*720 + date.c.day*24 + date.c.hour + date.c.minute/60 + date.c.second/3600 + date.c.millisecond/360000

    if (date.c.hour < 10) {
      date.c.hour = "0"+date.c.hour
    }
    if (date.c.minute < 10) {
      date.c.minute = "0"+date.c.minute
    }
    if (date.c.second < 10) {
      date.c.second = "0"+date.c.second
    }
    if (date.c.month < 10) {
      date.c.month = "0"+date.c.month
    }
    if (date.c.day < 10) {
      date.c.day = "0"+date.c.day
    }
    // `Date: ${date.toLocaleString(DateTime.DATE_FULL)} Time: ${date.toLocaleString(DateTime.TIME_24_WITH_LONG_OFFSET)}`
    const dateObject = {
      date: date.toLocaleString(DateTime.DATE_FULL),
      time: date.toLocaleString(DateTime.TIME_24_WITH_LONG_OFFSET),
      formatedTime: date.c.hour+":"+date.c.minute+":"+date.c.second+" "+ampm,
      expireTime,
      month: Number(date.c.month),
      day: Number(date.c.day),
      hour: Number(date.c.hour),
      minute: Number(date.c.minute),
      second: Number(date.c.second),
      AmPm: ampm,
    }
    return dateObject
}
