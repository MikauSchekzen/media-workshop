module.exports = function(grunt) {
	grunt.initConfig({
		concat: {
			options: {
				separator: "\n"
			},
			dist: {
				src: [
					// SOURCES

					"lib/main.js"

				],
				dest: "dist.js"
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-concat");

	grunt.registerTask("default", ["concat"]);
};
