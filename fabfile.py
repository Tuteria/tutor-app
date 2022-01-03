import os
from fabric.api import local, run, cd, env, sudo, settings, lcd,prompt
from fabric.colors import red
from fabric.decorators import hosts

env.hosts = ['sama@tuteria.com']

password = os.getenv('PRODUCTION_PASSWORD', '')


def update_images(scale=1, celery=False, callback=None):
    with settings(user="sama",password=password):
        with cd("/home/sama/tuteria"):
            sudo('docker-compose pull app')
            if callback:
                callback()
                pass
            else:
                sudo('docker-compose up -d --scale app={} app'.format(scale))
                if celery:
                    sudo('docker-compose up -d --scale worker={} worker '.format(scale))
            sudo('docker rmi $(docker images --filter "dangling=true" -q --no-trunc)')
            # sudo('docker rmi $(docker images -a -q)')

def deploy_next(user="sama", password=password):
    with settings(user="sama", password=password):
        with cd("/home/sama/web_deploy"):
            run('docker-compose pull tutor-next')
            run('docker-compose up -d tutor-next') 
            # run('docker-compose pull store-next')
            # run('docker-compose up -d store-next') 
            run('docker rmi $(docker images --filter "dangling=true" -q --no-trunc)')
    

@hosts('sama@staging-prod.tuteria.com')
def deploy_staging():
    with cd('/home/sama/tuteria-codebase/tuteria-deploy'):
        run('docker-compose pull tutor-next')
        run('docker-compose up -d tutor-next')
    run('docker rmi $(docker images --filter "dangling=true" -q --no-trunc)')    
