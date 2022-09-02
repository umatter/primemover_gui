if [[ -v API_ENDPOINT ]]
then
  sed -i 's|<meta name="config" property="api" content="">|<meta name="config" property="api" content="'$API_ENDPOINT'">|g' index.html
fi
