function directoryRefresh() {
  console.log("directoryRefresh");
  var path = $('#dirpath').val()+ "/"+$(this).text();
  $.ajax({
      type: "GET",
      url: '/dir?path=' + path,
      data: {},
      success: function (data) {
          var files = data.files;
          var dirPath = data.dirpath;
          $('#dirpath').val(dirPath);
          $('#tablePopulator').empty();
          files.forEach(function (file) {
              var row = $('<tr>');
              var name = $('<td>');
              var type = $('<td>');
              var size = $('<td>');
              if (file.isdir) {
                name.append('<p class="readdir"><i class="fa fa-folder"></i>' + file.name + '</p> </td>');
              } else {
                  row = $('<tr class="fileselector">');
                  name.append(file.name + '</td>');
              } type.append(file.type + '</td>');
              size.append(file.size + '</td>');
              row.append(name);
              row.append(type);
              row.append(size);
              $('#tablePopulator').append(row);
          });
          $('.readdir').on("click", directoryRefresh);
          $('.fileselector').on("click", function () {
              $(this).addClass('bg-primary').siblings().removeClass('bg-primary');
              var filename = $(this).find('td:first').text().trim();
              var filepath = $('#dirpath').val() + '/' + filename;
              $('#filepath').val(filepath);
          });
      }
  });
}

function directoryBack() {
    var path = $('#dirpath').val();
    var pathArray = path.split('/');
    pathArray.pop();
    path = pathArray.join('/');
    $.ajax({
        type: "GET",
        url: '/dir?path=' + path,
        data: {},
        success: function (data) {
            var files = data.files;
            var dirPath = data.dirpath;
            $('#dirpath').val(dirPath);
            $('#tablePopulator').empty();
            files.forEach(function (file) {
                var row = $('<tr>');
                var name = $('<td>');
                var type = $('<td>');
                var size = $('<td>');
                if (file.isdir) {
                  name.append('<p class="readdir"><i class="fa fa-folder"></i>' + file.name + '</p> </td>');
                } else {
                    row = $('<tr class="fileselector">');
                    name.append(file.name + '</td>');
                } type.append(file.type + '</td>');
                size.append(file.size + '</td>');
                row.append(name);
                row.append(type);
                row.append(size);
                $('#tablePopulator').append(row);
            });
            $('.readdir').on("click", directoryRefresh);
            $('.fileselector').on("click", function () {
                $(this).addClass('bg-primary').siblings().removeClass('bg-primary');
                var filename = $(this).find('td:first').text().trim();
                var filepath = $('#dirpath').val() + '/' + filename;
                $('#filepath').val(filepath);
            });
        }
    });
  }

function directoryUpdate() {
    var path = $('#dirpath').val();
    $.ajax({
        type: "GET",
        url: '/dir?path=' + path,
        data: {},
        success: function (data) {
            var files = data.files;
            var dirPath = data.dirpath;
            $('#dirpath').val(dirPath);
            $('#tablePopulator').empty();
            files.forEach(function (file) {
                var row = $('<tr>');
                var name = $('<td>');
                var type = $('<td>');
                var size = $('<td>');
                if (file.isdir) {
                    name.append('<p class="readdir"><i class="fa fa-folder"></i>' + file.name + '</p> </td>');
                } else {
                    row = $('<tr class="fileselector">');
                    name.append(file.name + '</td>');
                } type.append(file.type + '</td>');
                size.append(file.size + '</td>');
                row.append(name);
                row.append(type);
                row.append(size);
                $('#tablePopulator').append(row);
            });
            $('.readdir').on("click", directoryRefresh);
            $('.fileselector').on("click", function () {
                $(this).addClass('bg-primary').siblings().removeClass('bg-primary');
                var filename = $(this).find('td:first').text().trim();
                var filepath = $('#dirpath').val() + '/' + filename;
                $('#filepath').val(filepath);
            });
            $('#fileSelectionModal').modal('show');

            /*test = data.id;
        $('#calendar').fullCalendar('removeEvents', data.id);
        displayMessage("Test removed");*/
        }
    });
}
$('#directoryBack').on("click", directoryBack);
$('#directoryShow').on("click", directoryUpdate);
