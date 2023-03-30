function directoryUpdate(){
    var path = $('#dirpath').val();
    $.ajax({
      type: "GET",
      url: '/test?path='+$('dirpath').val();,
      data: {
      },
      success: function (data) {
        var files = data.files;
        files.forEach(function(file) {
          var row = $('<tr>');
          var name = $('<td>');
          var type = $('<td>');
          var size = $('<td>');
          if (file.isdir) {
            name.append('<a href="/dir?path=' + file.path + '"><i class="fa fa-folder"></i>' + file.name + '</a> </td>');
          } else {
            row = $('<tr class="fileselector">');
            name.append( file.name + '</td>');
          }
          type.append(file.type+ '</td>');
          size.append(file.size+ '</td>');
          row.append(name);
          row.append(type);
          row.append(size);
          $('#tablePopulator').append(row);
        });
        $('.fileselector').on("click", function(){
          $(this).addClass('bg-primary').siblings().removeClass('bg-primary');
          var filename=$(this).find('td:first').text().trim();
          var filepath=$('#dirpath').val()+'/'+filename;
          $('#filepath').val(filepath);
        });
        $('#fileSelectionModal').modal('show');
  
        /*test = data.id;
        $('#calendar').fullCalendar('removeEvents', data.id);
        displayMessage("Test removed");*/
      }
    });
}
$('#directoryShow').on("click", directoryUpdate);