const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});
let seats = [];
const port = process.env.PORT || 8000;

//Start socket connection
io.on('connection', socket => {
  console.log(`${socket.id} is connected`);
  // Receive ma lich chieu from  client
  socket.on('SEND_CHON_GHE_SELECT', data => {
    let index = seats.findIndex(item => item.maLichChieu === data.maLichChieu);
    if (index === -1) {
      seats.push({
        maLichChieu: data.maLichChieu,
        listUserSelected: [
          {
            taiKhoan: data.taiKhoan,
            gheDangChon: [data.seat.maGhe],
          },
        ],
      });
    } else {
      let temp = seats[index].listUserSelected.findIndex(
        item => item.taiKhoan === data.taiKhoan,
      );
      // add new seat
      if (temp !== -1) {
        seats[index].listUserSelected[temp].gheDangChon = [
          ...seats[index].listUserSelected[temp].gheDangChon,
          data.seat.maGhe,
        ];
      } else {
        seats[index].listUserSelected.push({
          taiKhoan: data.taiKhoan,
          gheDangChon: [data.seat.maGhe],
        });
      }
    }
    io.emit('RECEIVE_CHON_GHE_SELECT', data);
  });
  socket.on('SEND_BO_CHON_GHE_SELECT', data => {
    let index = seats.findIndex(item => item.maLichChieu === data.maLichChieu);
    if (index !== -1) {
      let temp = seats[index].listUserSelected.findIndex(
        item => item.taiKhoan === data.taiKhoan,
      );
      if (temp !== -1) {
        let filterList = seats[index].listUserSelected[temp].gheDangChon.filter(
          item => item !== data.seat.maGhe,
        );
        seats[index].listUserSelected[temp].gheDangChon = [...filterList];
      }
    }
    io.emit('RECEIVE_BO_CHON_GHE_SELECT', data);
  });
  socket.on('REMOVE_SELECT_SEAT', data => {
    let index = seats.findIndex(item => item.maLichChieu === data.maLichChieu);
    if (index !== -1) {
      let userIndex = seats[index].listUserSelected.findIndex(
        item => item.taiKhoan === data.taiKhoan,
      );
      seats[index].listUserSelected.splice(userIndex, 1);
    }
    io.emit('SEND_REMOVE_SELECT_SEAT', data);
  });
  socket.on('RECEIVE_DISABLE_SEAT', data => {
    let index = seats.findIndex(item => item.maLichChieu === data.maLichChieu);
    if (index !== -1) {
      let userIndex = seats[index].listUserSelected.findIndex(
        item => item.taiKhoan === data.taiKhoan,
      );
      // Lấy danh sách của những người khác
      let filterList = seats[index].listUserSelected.filter(
        (item, index) => index !== userIndex,
      );
      let disabledArr = filterList.reduce((curr, prev) => {
        return [...curr, ...prev.gheDangChon];
      }, []);
      let listDisablesCurrent = [...disabledArr];
      io.to(socket.id).emit('SEND_DISABLE_SEAT_NOW', {
        maLichChieu: data.maLichChieu,
        listDisablesCurrent,
      });
    }
  });
});
server.listen(port, () => {
  console.log(`Server is up on port  ${port}!`);
});
