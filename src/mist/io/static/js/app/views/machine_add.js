define('app/views/machine_add', ['app/views/templated', 'ember'],
    /**
     *  Machine Add View
     *
     *  @returns Class
     */
    function (TemplatedView) {
        return TemplatedView.extend({

            /**
             *  Properties
             */

            price: function () {

                var image = Mist.machineAddController.newMachineImage;
                var size = Mist.machineAddController.newMachineSize;
                var provider = Mist.machineAddController.newMachineProvider;
                var location = Mist.machineAddController.newMachineLocation;

                if (!image || !image.id || !size || !size.id || !provider || !provider.id) return 0;

                try { //might fail with TypeError if no size for this image
                    if (provider.provider.indexOf('ec2') > -1) {
                        if (image.name.indexOf('SUSE Linux Enterprise') > -1)
                            return size.price.sles;
                        if (image.name.indexOf('Red Hat') > -1)
                            return size.price.rhel;
                        return size.price.linux;
                    }
                    if (provider.provider.indexOf('rackspace') > -1) {
                        if (image.name.indexOf('Red Hat') > -1)
                            return size.price.rhel;
                        if (image.name.indexOf('Vyatta') > -1)
                            return size.price.vyatta;
                        return size.price.linux;
                    }
                    if (provider.provider.indexOf('gce') > -1) {
                        if (location.name.indexOf('europe-') > -1)
                            return size.price.eu;
                        if (location.name.indexOf('us-') > -1)
                            return size.price.us;
                        if (location.name.indexOf('asia-') > -1)
                            return size.price.as;
                        return size.price.eu;
                    }
                    return size.price;

                } catch (error) {
                    return 0;
                }
            }.property('Mist.machineAddController.newMachineProvider',
                       'Mist.machineAddController.newMachineImage',
                       'Mist.machineAddController.newMachineSize',
                       'Mist.machineAddController.newMachineLocation'),


            /**
             *
             *  Initialization
             *
             */

             load: function () {

                // Add event listeners
                Mist.keysController.on('onKeyListChange', this, 'renderFields');
                Mist.backendsController.on('onImageListChange', this, 'renderFields');

                // Connect view with machineAddController
                var viewId = $('#create-machine-panel').parent().attr('id');
                Mist.machineAddController.set('view', Ember.View.views[viewId]);

             }.on('didInsertElement'),


             unload: function () {

                // Remove event listeners
                Mist.keysController.off('onKeyListChange', this, 'renderFields');
                Mist.backendsController.off('onImageListChange', this, 'renderFields');

             }.on('willDestroyElement'),


            /**
             *
             *  Methods
             *
             */

             fieldIsReady: function (field) {
                $('#create-machine-' + field).collapsible('option', 'collapsedIcon', 'check')
                                             .collapsible('collapse');
             },


             renderFields: function () {
                Ember.run.next(function () {

                    // Render collapsibles
                    if ($('.ui-collapsible').collapsible) {
                        $('.ui-collapsible').collapsible();
                    }

                    // Render listviews
                    if ($('.ui-listview').listview) {
                        $('.ui-listview').listview()
                                         .listview('refresh');
                    }
                });
             },


             updateLaunchButton: function () {
                if (Mist.machineAddController.formReady) {
                    $('#create-machine-ok').removeClass('ui-state-disabled');
                } else {
                    $('#create-machine-ok').addClass('ui-state-disabled');
                }
             },


            /**
             *
             *  Actions
             *
             */

            actions: {


                selectProvider: function (backend) {

                    if (this.fieldIsReady) {
                        this.fieldIsReady('provider');
                    }

                    backend.networks.content.forEach(function (network, index) {
                        network.set('selected', false);
                    });
                    Mist.machineAddController.set('newMachineLocation', {'name' : 'Select Location'})
                                             .set('newMachineImage', {'name' : 'Select Image'})
                                             .set('newMachineSize', {'name' : 'Select Size'})
                                             .set('newMachineProvider', backend);

                    $('#create-machine-image').removeClass('ui-state-disabled');
                    $('#create-machine-location').addClass('ui-state-disabled');
                    $('#create-machine-size').addClass('ui-state-disabled');
                    $('#create-machine-key').addClass('ui-state-disabled');
                    $('#create-machine-network .ui-collapsible').addClass('ui-state-disabled');

                    if (backend.get('hasNetworks')) {
                        if (backend.networks.content.length > 0) {
                            $('#create-machine-network').show();
                            $('label[for=create-machine-script]').text('8. Script:');
                        }
                    } else {
                        $('#create-machine-network').hide();
                        $('label[for=create-machine-script]').text('7. Script:');
                    }
                },


                selectImage: function (image) {

                    if (this.fieldIsReady) {
                        this.fieldIsReady('image');
                    }

                    Mist.machineAddController.set('newMachineLocation', {'name' : 'Select Location'})
                                             .set('newMachineSize', {'name' : 'Select Size'})
                                             .set('newMachineImage', image);

                   $('#create-machine-location').addClass('ui-state-disabled');
                   $('#create-machine-size').removeClass('ui-state-disabled');
                   $('#create-machine-key').addClass('ui-state-disabled');
                   $('#create-machine-network .ui-collapsible').addClass('ui-state-disabled');
                },


                selectSize: function (size) {

                    this.fieldIsReady('size');

                    Mist.machineAddController.set('newMachineLocation', {'name' : 'Select Location'})
                                             .set('newMachineSize', size);

                    $('#create-machine-location').removeClass('ui-state-disabled');
                    $('#create-machine-key').addClass('ui-state-disabled');
                    $('#create-machine-network .ui-collapsible').addClass('ui-state-disabled');

                    // Docker specific
                    if (Mist.machineAddController.newMachineProvider.provider == 'docker')
                        // Because SSH key is optional for docker, so is location
                        $('#create-machine-key').removeClass('ui-state-disabled');
                },


                selectLocation: function (location) {

                    this.fieldIsReady('location');

                    Mist.machineAddController.set('newMachineLocation', location);
                    $('#create-machine-key').removeClass('ui-state-disabled');
                    $('#create-machine-network .ui-collapsible').addClass('ui-state-disabled');
                },


                selectKey: function (key) {
                    this._selectKey(key)
                },


                toggleNetworkSelection: function (network) {
                    network.set('selected', !network.selected);
                    $('#create-machine-machine')
                        .collapsible('option', 'collapsedIcon', 'check')
                        .collapsible('collapse');
                },


                createKeyClicked: function () {
                    var that = this;
                    Mist.keyAddController.open(function (success, key) {
                        that._selectKey(key);
                    });
                },


                backClicked: function () {
                    Mist.machineAddController.close();
                },


                launchClicked: function () {
                    Mist.machineAddController.add();
                }
            },


            _selectKey: function (key) {

                this.fieldIsReady('key');

                Mist.machineAddController.set('newMachineKey', key);
                $('#create-machine-monitoring').removeClass('ui-state-disabled');
                $('#create-machine-network .ui-collapsible')
                    .removeClass('ui-state-disabled')
                    .parent()
                    .trigger('create')
                    .find('label')
                    .removeClass('ui-corner-all');
            },


            /**
             *
             *  Observers
             *
             */

             bindingsObserver: function () {
                Ember.run.once(this, 'renderFields');
             }.observes('Mist.machineAddController.newMachineSize',
                        'Mist.machineAddController.newMachineImage',
                        'Mist.machineAddController.newMachineProvider',
                        'Mist.machineAddController.newMachineLocation'),


             formReadyObserver: function () {
                Ember.run.once(this, 'updateLaunchButton');
             }.observes('Mist.machineAddController.formReady')
        });
    }
);
