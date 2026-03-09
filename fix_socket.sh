grep -v socket.io public/worldmap.html > tmp_map.html

awk '
/<\/body>/{
print "<script src=\"/socket.io/socket.io.js\"></script>"
}
{print}
' tmp_map.html > public/worldmap.html

rm tmp_map.html
