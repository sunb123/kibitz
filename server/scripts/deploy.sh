#!/bin/bash
# deploy using apache2 on openstack instance


# 1) Copy ang app to sub uri
# 2) Build a dist through gulp. make sure has bower and node packages installed. insure sass is installed.
# 3) Add Alias to recommender name in /etc/apache2/sites-enabled/000-default.conf
# 4) Restart server . call sudo service apache2 restart

APP_LOCATION='' # url name
LINE_NUM=34

while getopts n: FLAG; do
    case $FLAG in
        n)
            case $OPTARG in
                *)
		    APP_LOCATION=$OPTARG
                ;;
            esac
        ;;
        *)
            echo "error: unknown option $FLAG"
            exit 1
        ;;
    esac
done

echo $APP_LOCATION

sudo sed -i "34 a Alias /$APP_LOCATION /var/www/html/kibitz/user-app/dist" /etc/apache2/sites-enabled/000-default.conf
sudo service apache2 reload # restart
