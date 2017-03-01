#!/bin/bash

URL_NAME=''

while getopts n: FLAG; do
    case $FLAG in
        n)
            case $OPTARG in
                *)
                    URL_NAME=$OPTARG
                ;
            esac
        ;;
        *)
            echo "error: unknown option $FLAG"
            exit 1
        ;;
    esac
done

echo $URL_NAME

sudo sed -i.bak "/.*\/$URL_NAME.*\#kibitz_alias_url.*/d" /etc/apache2/sites-enabled/000-default.conf # create a bak backup file
sudo service apache2 reload # restart